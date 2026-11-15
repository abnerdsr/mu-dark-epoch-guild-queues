import { z } from "zod";
import { ok, readJson, route } from "@/lib/server/http";
import { approve, changePosition, moveToEnd, removePerson } from "@/lib/server/queues";
import { idSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";

type Context = { params: Promise<{ queueId: string; itemId: string }> };

async function readIds(params: Context["params"]) {
  const { queueId, itemId } = await params;
  return { queueId: idSchema.parse(queueId), itemId: idSchema.parse(itemId) };
}

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("move-to-end") }),
  z.object({
    action: z.literal("change-position"),
    position: z.number().int().min(1, "Posição inválida").max(10000, "Posição inválida"),
  }),
]);

/** Ações do master sobre uma pessoa da fila. */
export const PATCH = route<Context>(async (request, { params }) => {
  await requireUser({ master: true });
  const { queueId, itemId } = await readIds(params);
  const body = await readJson(request, actionSchema);

  switch (body.action) {
    case "approve":
      await approve(queueId, itemId);
      break;
    case "move-to-end":
      await moveToEnd(queueId, itemId);
      break;
    case "change-position":
      await changePosition(queueId, itemId, body.position);
      break;
  }

  return ok({ success: true });
});

export const DELETE = route<Context>(async (_request, { params }) => {
  await requireUser({ master: true });
  const { queueId, itemId } = await readIds(params);
  await removePerson(queueId, itemId);
  return ok({ success: true });
});
