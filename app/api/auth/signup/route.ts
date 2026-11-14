import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { check, conflict, ok, readJson, route } from "@/lib/server/http";
import { hashPassword } from "@/lib/server/password";
import { nameSchema, newPasswordSchema, usernameSchema } from "@/lib/server/schemas";
import { startSession, toAuthUser, USER_COLUMNS, type DbUser } from "@/lib/server/session";

const bodySchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  password: newPasswordSchema,
});

export const POST = route(async (request) => {
  const { name, username, password } = await readJson(request, bodySchema);

  const db = getSupabaseAdmin();
  const existing = check(await db.from("users").select("id").eq("username", username).limit(1), "verificar username");
  if (existing && existing.length > 0) throw conflict("Este username já está em uso");

  const user = check(
    await db
      .from("users")
      .insert([{ name, username, password: await hashPassword(password), role: "user" }])
      .select(USER_COLUMNS)
      .single<DbUser>(),
    "cadastro"
  );
  if (!user) throw new Error("Cadastro não retornou o usuário criado");

  await startSession(user);
  return ok({ user: toAuthUser(user) });
});
