import { NextResponse } from "next/server";
import { APP_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic";

// Usado pelo aviso de "nova versão disponível": o navegador compara a versão
// com a que veio no bundle que ele está rodando.
export function GET() {
  return NextResponse.json({ version: APP_VERSION }, { headers: { "Cache-Control": "no-store" } });
}
