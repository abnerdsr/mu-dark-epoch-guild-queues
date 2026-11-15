import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { check, conflict, ok, readJson, route } from "@/lib/server/http";
import { hashPassword } from "@/lib/server/password";
import { nameSchema, usernameSchema } from "@/lib/server/schemas";
import { getSessionUser, requireUser } from "@/lib/server/session";
import type { ListedUser } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Lista de usuários. Pública porque os cards das filas mostram quem é master;
 * o username (usado para login) só é enviado para masters.
 */
export const GET = route(async () => {
  const viewer = await getSessionUser();
  const isMaster = viewer?.role === "master" && !viewer.must_change_password;

  const rows = check(
    await getSupabaseAdmin().from("users").select("id, name, username, role").order("created_at", { ascending: true }),
    "listar usuários"
  );

  const users: ListedUser[] = (rows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    username: isMaster ? row.username : "",
    role: row.role,
  }));

  return ok({ users });
});

const createSchema = z.object({ name: nameSchema, username: usernameSchema });

/** Master cria um usuário. A senha inicial é o username e precisa ser trocada no primeiro login. */
export const POST = route(async (request) => {
  await requireUser({ master: true });
  const { name, username } = await readJson(request, createSchema);

  const db = getSupabaseAdmin();
  const existing = check(await db.from("users").select("id").eq("username", username).limit(1), "verificar username");
  if (existing && existing.length > 0) throw conflict("Este username já está em uso");

  check(
    await db.from("users").insert([
      {
        name,
        username,
        password: await hashPassword(username),
        role: "user",
        must_change_password: true,
      },
    ]),
    "criar usuário"
  );

  return ok({ success: true }, { status: 201 });
});
