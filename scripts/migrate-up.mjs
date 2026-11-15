// Roda as migrations (node-pg-migrate up).
//
// Na Vercel o comando de install é `pnpm install && pnpm run migrate:up`, e ele
// roda em TODO deploy, inclusive nos de preview de qualquer branch. Como o
// DATABASE_URL aponta para o banco de produção, uma branch em desenvolvimento
// poderia alterar a produção antes do código dela estar no ar. Por isso, na
// Vercel, as migrations só rodam no deploy de produção.
import { spawnSync } from "node:child_process";

const vercelEnv = process.env.VERCEL_ENV;

if (process.env.VERCEL && vercelEnv !== "production") {
  console.log(`[migrate] Deploy de "${vercelEnv ?? "desconhecido"}" na Vercel: migrations ignoradas (só rodam em produção).`);
  process.exit(0);
}

const result = spawnSync("node-pg-migrate", ["up", "-m", "database/migrations", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error("[migrate] Falha ao executar node-pg-migrate:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
