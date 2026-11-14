import { z } from "zod";
import { ok, readJson, route } from "@/lib/server/http";
import { createQueue, listQueues } from "@/lib/server/queues";
import { queueTitleSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

// Filas são públicas (visitantes sem login também veem a página).
export const GET = route(async () => {
  return ok({ queues: await listQueues() });
});

const createSchema = z.object({ title: queueTitleSchema });

export const POST = route(async (request) => {
  const user = await requireUser({ master: true });
  const { title } = await readJson(request, createSchema);
  await createQueue(title, user);
  return ok({ success: true }, { status: 201 });
});
