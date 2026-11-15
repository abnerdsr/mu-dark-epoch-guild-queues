import { ok, route } from "@/lib/server/http";
import { requestToJoin } from "@/lib/server/queues";
import { idSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";

type Context = { params: Promise<{ queueId: string }> };

/** O próprio usuário pede para entrar na fila. */
export const POST = route<Context>(async (_request, { params }) => {
  const user = await requireUser();
  const queueId = idSchema.parse((await params).queueId);
  await requestToJoin(queueId, user);
  return ok({ success: true }, { status: 201 });
});
