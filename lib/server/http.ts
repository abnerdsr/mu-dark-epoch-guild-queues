import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

export const unauthorized = () => new ApiError(401, "UNAUTHORIZED", "Faça login para continuar");
export const forbidden = (message = "Sem permissão para esta ação") => new ApiError(403, "FORBIDDEN", message);
export const notFound = (message = "Não encontrado") => new ApiError(404, "NOT_FOUND", message);
export const badRequest = (message: string) => new ApiError(400, "BAD_REQUEST", message);
export const conflict = (message: string) => new ApiError(409, "CONFLICT", message);

type Handler<C> = (request: Request, context: C) => Promise<Response>;

/** Envolve uma rota tratando ApiError/ZodError e erros inesperados de forma uniforme. */
export function route<C>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
      }
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message ?? "Dados inválidos";
        return NextResponse.json({ error: message, code: "BAD_REQUEST" }, { status: 400 });
      }
      console.error("Erro inesperado na API:", error);
      return NextResponse.json({ error: "Erro interno do servidor", code: "INTERNAL" }, { status: 500 });
    }
  };
}

/** Lê e valida o corpo JSON. Exigir JSON também evita POSTs de formulários de outros sites (CSRF). */
export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Envie os dados como JSON");
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw badRequest("JSON inválido");
  }
  return schema.parse(body);
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Lança ApiError se a chamada ao Supabase falhou. */
export function check<T>(result: { data: T; error: { message: string; code?: string } | null }, context: string): T {
  if (result.error) {
    if (result.error.code === "23505") {
      throw conflict("Registro já existe");
    }
    console.error(`Erro no banco (${context}):`, result.error);
    throw new ApiError(500, "DATABASE_ERROR", "Erro ao acessar o banco de dados");
  }
  return result.data;
}
