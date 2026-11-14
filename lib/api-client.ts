// Cliente das rotas em app/api. O navegador NÃO fala mais direto com o Supabase.

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function api<T = unknown>(method: Method, path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // resposta sem corpo JSON
  }

  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      data?.code ?? "UNKNOWN",
      data?.error ?? `Erro ${response.status}`
    );
  }

  return data as T;
}
