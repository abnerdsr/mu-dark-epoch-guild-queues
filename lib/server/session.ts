import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { check, forbidden, unauthorized, ApiError } from "@/lib/server/http";
import type { AuthUser } from "@/lib/types";

// Sessão = cookie httpOnly com um token assinado (HMAC-SHA256) pelo servidor.
// O token guarda só o id do usuário; nome/role são sempre relidos do banco,
// então mudanças de role ou exclusão do usuário valem na hora.
export const SESSION_COOKIE = "mu_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

interface SessionPayload {
  uid: string;
  /** "Versão" da senha: trocar a senha invalida as outras sessões. */
  pv: string;
  exp: number;
}

export interface DbUser {
  id: string;
  username: string;
  name: string;
  password: string;
  role: "master" | "user";
  must_change_password: boolean;
}

export const USER_COLUMNS = "id, username, name, password, role, must_change_password";

function getSecret(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET precisa estar definida com pelo menos 32 caracteres");
  }
  return Buffer.from(secret);
}

function sign(data: string): string {
  return createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function passwordVersion(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);
}

function createToken(user: DbUser): string {
  const payload: SessionPayload = {
    uid: user.id,
    pv: passwordVersion(user.password),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function readToken(token: string): SessionPayload | null {
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const expected = Buffer.from(sign(data));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    if (typeof payload.uid !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function startSession(user: DbUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function endSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function toAuthUser(user: DbUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    mustChangePassword: user.must_change_password,
  };
}

/** Usuário da sessão atual (relido do banco) ou null. */
export async function getSessionUser(): Promise<DbUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = readToken(token);
  if (!payload) return null;

  const user = check(
    await getSupabaseAdmin().from("users").select(USER_COLUMNS).eq("id", payload.uid).maybeSingle<DbUser>(),
    "carregar usuário da sessão"
  );

  if (!user || passwordVersion(user.password) !== payload.pv) return null;
  return user;
}

interface RequireOptions {
  master?: boolean;
  /** Permite a ação mesmo se o usuário ainda precisa trocar a senha. */
  allowPendingPasswordChange?: boolean;
}

/** Garante um usuário logado (e master, se pedido). Lança 401/403 caso contrário. */
export async function requireUser(options: RequireOptions = {}): Promise<DbUser> {
  const user = await getSessionUser();
  if (!user) throw unauthorized();

  if (user.must_change_password && !options.allowPendingPasswordChange) {
    throw new ApiError(403, "PASSWORD_CHANGE_REQUIRED", "Troque sua senha antes de continuar");
  }

  if (options.master && user.role !== "master") {
    throw forbidden("Apenas masters podem fazer isso");
  }

  return user;
}
