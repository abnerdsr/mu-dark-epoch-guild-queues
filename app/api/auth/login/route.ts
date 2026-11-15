import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ApiError, check, ok, readJson, route } from "@/lib/server/http";
import { hashPassword, isLegacyHash, verifyPassword } from "@/lib/server/password";
import { startSession, toAuthUser, USER_COLUMNS, type DbUser } from "@/lib/server/session";

const bodySchema = z.object({
  username: z.string().trim().min(1).max(50),
  password: z.string().min(1).max(200),
});

const invalidCredentials = () => new ApiError(401, "INVALID_CREDENTIALS", "Usuário ou senha incorretos");

export const POST = route(async (request) => {
  const { username, password } = await readJson(request, bodySchema).catch(() => {
    throw invalidCredentials();
  });

  const db = getSupabaseAdmin();
  const user = check(
    await db.from("users").select(USER_COLUMNS).eq("username", username).maybeSingle<DbUser>(),
    "login"
  );

  if (!user || !(await verifyPassword(password, user.password))) {
    throw invalidCredentials();
  }

  // Migração transparente: senha no hash antigo é regravada com scrypt.
  if (isLegacyHash(user.password)) {
    const newHash = await hashPassword(password);
    check(await db.from("users").update({ password: newHash }).eq("id", user.id), "atualizar hash da senha");
    user.password = newHash;
  }

  await startSession(user);
  return ok({ user: toAuthUser(user) });
});
