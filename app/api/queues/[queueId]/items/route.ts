import { z } from "zod";
import { ok, readJson, route } from "@/lib/server/http";
import { addPerson } from "@/lib/server/queues";
import { idSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";

type Context = { params: Promise<{ queueId: string }> };

const bodySchema = z.object({ userId: idSchema });

/** Master adiciona uma pessoa (já aprovada) na fila. */
export const POST = route<Context>(async (request, { params }) => {
  await requireUser({ master: true });
  const queueId = idSchema.parse((await params).queueId);
  const { userId } = await readJson(request, bodySchema);
  await addPerson(queueId, userId);
  return ok({ success: true }, { status: 201 });
});
