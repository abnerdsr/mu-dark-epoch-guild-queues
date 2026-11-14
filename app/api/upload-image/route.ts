import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { badRequest, ok, route } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";

const BUCKET = "queue-images";
const MAX_SIZE = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const POST = route(async (request) => {
  await requireUser({ master: true });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) throw badRequest("Arquivo é obrigatório");

  const extension = EXTENSIONS[file.type];
  if (!extension) throw badRequest("Envie uma imagem JPG, PNG, WEBP ou GIF");
  if (file.size > MAX_SIZE) throw badRequest("A imagem precisa ter menos de 5MB");

  const fileName = `queue-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const storage = getSupabaseAdmin().storage.from(BUCKET);

  const { error } = await storage.upload(fileName, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("Erro no upload:", error);
    throw badRequest(`Falha no upload: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = storage.getPublicUrl(fileName);

  return ok({ url: publicUrl });
});

export const DELETE = route(async (request) => {
  await requireUser({ master: true });

  const imageUrl = new URL(request.url).searchParams.get("url");
  if (!imageUrl) throw badRequest("URL é obrigatória");

  // Só aceita arquivos do próprio bucket (evita apagar outros caminhos).
  const fileName = imageUrl.split("/").pop() ?? "";
  if (!/^queue-[\w-]+\.(jpg|png|webp|gif)$/.test(fileName)) throw badRequest("URL de imagem inválida");

  const { error } = await getSupabaseAdmin().storage.from(BUCKET).remove([fileName]);
  if (error) {
    console.error("Erro ao apagar imagem:", error);
    throw badRequest("Falha ao apagar a imagem");
  }

  return ok({ success: true });
});
