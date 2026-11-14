import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { badRequest, check, conflict, notFound, ok, readJson, route } from "@/lib/server/http";
import { idSchema, nameSchema, roleSchema, usernameSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";

type Context = { params: Promise<{ userId: string }> };

const updateSchema = z
  .object({
    name: nameSchema.optional(),
    username: usernameSchema.optional(),
    role: roleSchema.optional(),
  })
  .refine((body) => Object.keys(body).length > 0, "Nada para atualizar");

async function ensureUser(userId: string) {
  const user = check(
    await getSupabaseAdmin().from("users").select("id").eq("id", userId).maybeSingle(),
    "buscar usuário"
  );
  if (!user) throw notFound("Usuário não encontrado");
}

export const PATCH = route<Context>(async (request, { params }) => {
  const master = await requireUser({ master: true });
  const userId = idSchema.parse((await params).userId);
  const body = await readJson(request, updateSchema);

  if (userId === master.id && body.role === "user") {
    throw badRequest("Você não pode remover seu próprio acesso de master");
  }

  await ensureUser(userId);

  const db = getSupabaseAdmin();
  if (body.username) {
    const taken = check(
      await db.from("users").select("id").eq("username", body.username).neq("id", userId).limit(1),
      "verificar username"
    );
    if (taken && taken.length > 0) throw conflict("Este username já está em uso");
  }

  check(await db.from("users").update(body).eq("id", userId), "atualizar usuário");
  return ok({ success: true });
});

export const DELETE = route<Context>(async (_request, { params }) => {
  const master = await requireUser({ master: true });
  const userId = idSchema.parse((await params).userId);

  if (userId === master.id) {
    throw badRequest("Você não pode apagar o seu próprio usuário");
  }

  await ensureUser(userId);
  check(await getSupabaseAdmin().from("users").delete().eq("id", userId), "apagar usuário");
  return ok({ success: true });
});
