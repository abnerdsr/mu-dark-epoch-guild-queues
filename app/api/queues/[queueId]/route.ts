import { z } from "zod";
import { ok, readJson, route } from "@/lib/server/http";
import { deleteQueue, updateQueue } from "@/lib/server/queues";
import { idSchema, queueTitleSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";

type Context = { params: Promise<{ queueId: string }> };

const updateSchema = z.object({
  title: queueTitleSchema.optional(),
  item_name: z.string().trim().max(255, "Nome do item muito longo").optional(),
  image_url: z.string().url("URL de imagem inválida").max(2000).nullable().optional(),
});

export const PATCH = route<Context>(async (request, { params }) => {
  await requireUser({ master: true });
  const queueId = idSchema.parse((await params).queueId);
  await updateQueue(queueId, await readJson(request, updateSchema));
  return ok({ success: true });
});

export const DELETE = route<Context>(async (_request, { params }) => {
  await requireUser({ master: true });
  const queueId = idSchema.parse((await params).queueId);
  await deleteQueue(queueId);
  return ok({ success: true });
});
