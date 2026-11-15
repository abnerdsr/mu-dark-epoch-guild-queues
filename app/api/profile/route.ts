import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { check, ok, readJson, route } from "@/lib/server/http";
import { hashPassword } from "@/lib/server/password";
import { nameSchema, newPasswordSchema } from "@/lib/server/schemas";
import { requireUser, startSession, toAuthUser } from "@/lib/server/session";

const bodySchema = z.object({
  name: nameSchema,
  password: newPasswordSchema.optional(),
});

export const PATCH = route(async (request) => {
  const user = await requireUser();
  const { name, password } = await readJson(request, bodySchema);

  const update: { name: string; password?: string } = { name };
  if (password) update.password = await hashPassword(password);

  check(await getSupabaseAdmin().from("users").update(update).eq("id", user.id), "atualizar perfil");

  const updated = { ...user, ...update };
  // Trocar a senha invalida as outras sessões; renova a sessão atual.
  if (update.password) await startSession(updated);
  return ok({ user: toAuthUser(updated) });
});
