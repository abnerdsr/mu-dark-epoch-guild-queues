import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { badRequest, check, ok, readJson, route } from "@/lib/server/http";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { newPasswordSchema } from "@/lib/server/schemas";
import { requireUser, startSession, toAuthUser } from "@/lib/server/session";

const bodySchema = z.object({ newPassword: newPasswordSchema });

/** Troca de senha obrigatória do primeiro login (usuários criados pelo master). */
export const POST = route(async (request) => {
  const user = await requireUser({ allowPendingPasswordChange: true });
  const { newPassword } = await readJson(request, bodySchema);

  if (newPassword === user.username) {
    throw badRequest("A nova senha não pode ser igual ao username");
  }
  if (await verifyPassword(newPassword, user.password)) {
    throw badRequest("A nova senha precisa ser diferente da atual");
  }

  const password = await hashPassword(newPassword);
  check(
    await getSupabaseAdmin().from("users").update({ password, must_change_password: false }).eq("id", user.id),
    "trocar senha"
  );

  const updated = { ...user, password, must_change_password: false };
  await startSession(updated);
  return ok({ user: toAuthUser(updated) });
});
