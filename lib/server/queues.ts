import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { check, conflict, notFound } from "@/lib/server/http";
import type { DbUser } from "@/lib/server/session";
import type { QueueWithItems } from "@/lib/types";

// Lógica das filas, executada no servidor com a service role.
// Mantém o mesmo comportamento que existia no cliente (auth-provider.tsx);
// as melhorias de atomicidade/posições estão no backlog do AGENTS.md.

const db = () => getSupabaseAdmin();

interface ItemRow {
  id: string;
  queue_id: string;
  name: string;
  position: number;
  status: "waiting" | "approved" | "completed";
  requested_by: string;
}

export async function listQueues(): Promise<QueueWithItems[]> {
  const [queuesResult, itemsResult] = await Promise.all([
    db().from("queues").select("id, title, item_name, image_url").order("created_at", { ascending: true }),
    db()
      .from("queue_items")
      .select("id, queue_id, name, position, status, requested_by")
      .order("position", { ascending: true }),
  ]);

  const queues = check(queuesResult, "listar filas") ?? [];
  const items = (check(itemsResult, "listar itens das filas") ?? []) as ItemRow[];

  return queues.map((queue) => ({
    id: queue.id,
    title: queue.title,
    item_name: queue.item_name || "Queue Item",
    image_url: queue.image_url ?? undefined,
    items: items
      .filter((item) => item.queue_id === queue.id)
      .map((item) => ({
        id: item.id,
        name: item.name,
        position: item.position,
        status: item.status,
        requestedBy: item.requested_by,
      })),
  }));
}

async function ensureQueue(queueId: string) {
  const queue = check(await db().from("queues").select("id").eq("id", queueId).maybeSingle(), "buscar fila");
  if (!queue) throw notFound("Fila não encontrada");
}

async function getItem(queueId: string, itemId: string): Promise<ItemRow> {
  const item = check(
    await db()
      .from("queue_items")
      .select("id, queue_id, name, position, status, requested_by")
      .eq("id", itemId)
      .eq("queue_id", queueId)
      .maybeSingle<ItemRow>(),
    "buscar item da fila"
  );
  if (!item) throw notFound("Pessoa não encontrada nesta fila");
  return item;
}

async function nextPosition(queueId: string): Promise<number> {
  const items = check(
    await db()
      .from("queue_items")
      .select("position")
      .eq("queue_id", queueId)
      .order("position", { ascending: false })
      .limit(1),
    "buscar próxima posição"
  );
  return items && items.length > 0 ? items[0].position + 1 : 1;
}

async function ensureNotInQueue(queueId: string, userId: string) {
  const existing = check(
    await db().from("queue_items").select("id").eq("queue_id", queueId).eq("requested_by", userId).limit(1),
    "verificar se já está na fila"
  );
  if (existing && existing.length > 0) throw conflict("Pessoa já está nesta fila");
}

async function setPosition(itemId: string, position: number) {
  check(await db().from("queue_items").update({ position }).eq("id", itemId), "atualizar posição");
}

export async function createQueue(title: string, createdBy: DbUser) {
  check(await db().from("queues").insert([{ title, created_by: createdBy.id }]), "criar fila");
}

export async function updateQueue(
  queueId: string,
  details: { title?: string; item_name?: string; image_url?: string | null }
) {
  await ensureQueue(queueId);
  const update: Record<string, string | null> = {};
  if (details.title !== undefined) update.title = details.title;
  if (details.item_name !== undefined) update.item_name = details.item_name;
  if (details.image_url !== undefined) update.image_url = details.image_url;
  if (Object.keys(update).length === 0) return;

  check(await db().from("queues").update(update).eq("id", queueId), "atualizar fila");
}

export async function deleteQueue(queueId: string) {
  await ensureQueue(queueId);
  check(await db().from("queues").delete().eq("id", queueId), "apagar fila");
}

/** Usuário pede para entrar (master entra direto como aprovado). */
export async function requestToJoin(queueId: string, user: DbUser) {
  await ensureQueue(queueId);
  await ensureNotInQueue(queueId, user.id);

  check(
    await db()
      .from("queue_items")
      .insert([
        {
          queue_id: queueId,
          name: user.name,
          position: await nextPosition(queueId),
          status: user.role === "master" ? "approved" : "waiting",
          requested_by: user.id,
        },
      ]),
    "entrar na fila"
  );
}

/** Master adiciona outra pessoa já aprovada. */
export async function addPerson(queueId: string, userId: string) {
  await ensureQueue(queueId);
  await ensureNotInQueue(queueId, userId);

  const person = check(
    await db().from("users").select("name").eq("id", userId).maybeSingle<{ name: string }>(),
    "buscar usuário"
  );
  if (!person) throw notFound("Usuário não encontrado");

  check(
    await db()
      .from("queue_items")
      .insert([
        {
          queue_id: queueId,
          name: person.name,
          position: await nextPosition(queueId),
          status: "approved",
          requested_by: userId,
        },
      ]),
    "adicionar pessoa"
  );
}

export async function removePerson(queueId: string, itemId: string) {
  const item = await getItem(queueId, itemId);

  check(await db().from("queue_items").delete().eq("id", itemId), "remover pessoa");

  const after = check(
    await db().from("queue_items").select("id, position").eq("queue_id", queueId).gt("position", item.position),
    "buscar itens para reordenar"
  );
  for (const other of after ?? []) {
    await setPosition(other.id, other.position - 1);
  }
}

export async function approve(queueId: string, itemId: string) {
  await getItem(queueId, itemId);
  check(await db().from("queue_items").update({ status: "approved" }).eq("id", itemId), "aprovar pedido");
}

/** Manda o primeiro da fila para o fim (só vale para quem está na posição 1). */
export async function moveToEnd(queueId: string, itemId: string) {
  const item = await getItem(queueId, itemId);
  if (item.position !== 1) return;

  const last = check(
    await db()
      .from("queue_items")
      .select("position")
      .eq("queue_id", queueId)
      .order("position", { ascending: false })
      .limit(1),
    "buscar última posição"
  );
  const maxPosition = last?.[0]?.position || 1;

  const others = check(
    await db().from("queue_items").select("id, position").eq("queue_id", queueId).gt("position", 1),
    "buscar itens para reordenar"
  );
  for (const other of others ?? []) {
    await setPosition(other.id, other.position - 1);
  }

  await setPosition(itemId, maxPosition);
}

export async function changePosition(queueId: string, itemId: string, newPosition: number) {
  const item = await getItem(queueId, itemId);
  const oldPosition = item.position;
  if (oldPosition === newPosition) return;

  const approved = check(
    await db()
      .from("queue_items")
      .select("id, position")
      .eq("queue_id", queueId)
      .eq("status", "approved")
      .order("position", { ascending: true }),
    "buscar itens aprovados"
  );

  for (const other of approved ?? []) {
    if (other.id === itemId) continue;
    if (oldPosition < newPosition && other.position > oldPosition && other.position <= newPosition) {
      await setPosition(other.id, other.position - 1);
    } else if (oldPosition > newPosition && other.position >= newPosition && other.position < oldPosition) {
      await setPosition(other.id, other.position + 1);
    }
  }

  await setPosition(itemId, newPosition);
}
