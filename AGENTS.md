# AGENTS.md

Guia para agentes de IA (e humanos) que trabalham neste repositório.

## Visão geral

**MU Dark Epoch – Guild Queues** é um sistema web para controlar as filas de
loot de bosses de uma guild do jogo MU Dark Epoch. Cada fila representa um item
(ex.: uma asa, uma joia) e mantém a ordem de quem é o próximo a receber.

- Visitantes sem login podem ver as filas.
- Usuários comuns (`role = "user"`) pedem para entrar numa fila; o pedido fica
  como `waiting` até um master aprovar.
- Masters (`role = "master"`) criam/editam/apagam filas, aprovam pedidos,
  adicionam/removem pessoas, mudam posições, mandam o primeiro para o fim da
  fila e gerenciam usuários.
- Existe um sistema de "drops" (`drop_events` / `drop_participants`) que hoje
  está **desativado**: os componentes existem, mas não são montados em
  `app/page.tsx` e ainda acessam o Supabase direto pelo navegador (precisam ser
  migrados para `app/api` antes de voltar).

O projeto foi iniciado no v0 (Vercel), por isso há muitos componentes shadcn/ui
gerados que não são usados. O deploy é feito na Vercel.

## Stack

| Camada        | Tecnologia                                                    |
| ------------- | ------------------------------------------------------------- |
| Framework     | Next.js 15.5 (App Router) + React 19.1                        |
| Linguagem     | TypeScript (`strict`), módulos ESM (`"type": "module"`)       |
| UI            | Tailwind CSS 3, shadcn/ui (Radix), lucide-react, next-themes  |
| Backend       | Route Handlers do Next.js (`app/api`)                         |
| Dados         | Supabase (Postgres + Storage) via service role, só no servidor |
| Validação     | zod                                                           |
| Migrations    | `node-pg-migrate` (arquivos JS em `database/migrations`)      |
| Gerenciador   | **pnpm** (há `pnpm-lock.yaml`; não use npm/yarn)              |

## Comandos

```sh
cp .example.env .env      # preencher com os dados do Supabase + SESSION_SECRET
pnpm i                    # instalar dependências
pnpm run migrate:up       # aplicar migrations (usa DATABASE_URL)
pnpm run migrate:new nome # nova migration em database/migrations
pnpm dev                  # servidor local em http://localhost:3000
pnpm build                # build de produção
npx tsc --noEmit          # checagem de tipos (o build NÃO checa, ver abaixo)
```

Não existem testes automatizados nem ESLint configurado (`pnpm lint` chama
`next lint`, mas o ESLint não está instalado).

Para rodar `pnpm build` sem um Supabase real, basta definir valores fictícios
(as variáveis só são lidas quando uma rota é chamada):

```sh
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=dummy SESSION_SECRET=dummy pnpm build
```

### Rodando no container cloud do Claude Code

- A rede só sai por um proxy HTTPS. O `fetch` do Node ignora `HTTPS_PROXY` por
  padrão, então suba o servidor com
  `NODE_USE_ENV_PROXY=1 NODE_NO_WARNINGS=1 pnpm dev`.
- Conexões Postgres diretas (`DATABASE_URL`, `pnpm run migrate:*`) **não**
  funcionam daqui. Aplique SQL pelo conector do Supabase (MCP) ou peça para o
  usuário rodar no SQL Editor do Supabase. Ao aplicar uma migration à mão,
  registre-a também: `insert into pgmigrations (name, run_on) values ('<arquivo sem .js>', now());`.
- `SESSION_SECRET` local pode ficar em `.env.local` (ignorado pelo git).

### Variáveis de ambiente (`.example.env`)

| Variável                        | Uso                                                              |
| ------------------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`                  | Conexão Postgres usada pelo `node-pg-migrate`                    |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do projeto Supabase (lida pelo servidor)                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Chave service role, **somente servidor** (todo acesso a dados)   |
| `SESSION_SECRET`                | Segredo do cookie de sessão (≥ 32 caracteres; trocar desloga todos) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Não é mais usada pelo app (só pelo código de drops desativado)   |
| `ENVIRONMENT`                   | Ambiente (`local`, …) — hoje não é lido pelo código              |

Nunca commite `.env*` (já está no `.gitignore`).

## Estrutura

```
app/
  layout.tsx                 # layout raiz, ThemeProvider (tema dark fixo)
  page.tsx                   # única página; AuthProvider, modais, aviso de versão
  globals.css                # CSS global REAL (tema MU: cores mu-gold, mu-electric…)
  api/
    auth/{login,signup,logout,me,password}/route.ts  # sessão e troca de senha
    profile/route.ts                                 # editar o próprio perfil
    queues/route.ts                                  # GET (público) / POST criar
    queues/[queueId]/route.ts                        # PATCH editar / DELETE
    queues/[queueId]/join/route.ts                   # usuário pede para entrar
    queues/[queueId]/items/route.ts                  # master adiciona pessoa
    queues/[queueId]/items/[itemId]/route.ts         # aprovar/mover/posição/remover
    users/route.ts, users/[userId]/route.ts          # gerenciar usuários (master)
    upload-image/route.ts                            # imagens no bucket "queue-images"
    version/route.ts                                 # versão do build (aviso de deploy)
components/
  auth-provider.tsx          # Context com estado global; chama as rotas de app/api
  force-password-change-modal.tsx  # troca obrigatória de senha no 1º login
  update-notice.tsx          # aviso "nova versão disponível, recarregue"
  queue-grid.tsx, queue-card.tsx, queue-edit-modal.tsx, create-queue-modal.tsx
  header.tsx, login-modal.tsx, profile-modal.tsx, user-management-modal.tsx
  image-upload.tsx
  drop-*.tsx, participant-selection-panel.tsx, name-action-card.tsx,
  picked-up-list.tsx, missed-list.tsx   # drops (desativado, não montado)
  ui/                        # shadcn/ui gerado (maioria não usada)
hooks/                       # use-toast / use-mobile (duplicados de components/ui)
lib/
  server/                    # SOMENTE servidor
    session.ts               # cookie de sessão, requireUser(), getSessionUser()
    password.ts              # scrypt + verificação do hash legado
    queues.ts                # regras das filas (reordenação etc.)
    http.ts                  # route(), readJson(), ApiError, check()
    schemas.ts               # schemas zod compartilhados
  supabase-admin.ts          # getSupabaseAdmin(): cliente service role (só servidor!)
  api-client.ts              # api(): fetch tipado para as rotas (cliente)
  types.ts                   # tipos compartilhados cliente/servidor
  version.ts                 # APP_VERSION (definida em next.config.mjs)
  supabase.ts                # cliente anon + tipos antigos (usado só pelos drops)
  utils.ts                   # cn()
database/migrations/         # users, queues, queue_items, drop_*, must_change_password, lock
styles/globals.css           # cópia antiga do shadcn, NÃO é importada
```

Alias de import: `@/*` aponta para a raiz do repositório.

## Modelo de dados

- `users` — `id`, `username` (único), `name`, `password` (hash), `role`
  (`master` | `user`), `must_change_password`, `created_at`.
- `queues` — `id`, `title`, `item_name`, `image_url`, `created_by → users`.
- `queue_items` — `id`, `queue_id → queues`, `name`, `position` (1 = próximo),
  `status` (`waiting` | `approved` | `completed`), `requested_by → users`.
- `drop_events` — `queue_id`, `drop_count` (0–5), `created_by`.
- `drop_participants` — `drop_event_id`, `queue_item_id`, `name`,
  `action` (`accept` | `skip` | `decline`).

Tipos de API em `lib/types.ts` (`requested_by` vira `requestedBy` na API).
Se mudar o schema, atualize a migration **e** o código em `lib/server`.

O bucket de Storage `queue-images` precisa existir no Supabase e ser público
(não é criado por migration).

A branch `mult-guild` tem migrations antigas de multi-guild (tabela `guilds` e
`guild_id` em tudo) que **não** fazem parte da `main`.

## Como o app funciona

- **O navegador nunca fala com o Supabase.** Os componentes usam `useAuth()`
  (`components/auth-provider.tsx`), que chama as rotas em `app/api` via
  `api()` de `lib/api-client.ts`.
- **Sessão:** cookie `mu_session` (httpOnly, `SameSite=Lax`, 30 dias) com um
  token assinado por HMAC (`SESSION_SECRET`). O token guarda só o id do
  usuário e uma "versão" da senha; o usuário é relido do banco a cada request,
  então mudança de role/exclusão vale na hora e trocar a senha derruba as
  outras sessões.
- **Permissões:** toda rota que altera dados chama `requireUser()` (e
  `requireUser({ master: true })` para ações de master) no servidor.
- **Senhas:** scrypt (`lib/server/password.ts`). Hashes do formato antigo são
  aceitos e regravados com scrypt no primeiro login. Senhas novas têm no
  mínimo 6 caracteres.
- **Usuários criados pelo master** nascem com senha = username e
  `must_change_password = true`; enquanto não trocarem a senha, a API devolve
  `403 PASSWORD_CHANGE_REQUIRED` e a UI mostra um modal que não fecha.
- **Banco:** RLS ligado em todas as tabelas, sem policies, e sem permissões
  para `anon`/`authenticated` (migration `lock-public-tables`). Só a service
  role (servidor) acessa.
- **Aviso de nova versão:** `next.config.mjs` define `NEXT_PUBLIC_APP_VERSION`
  (id do deploy na Vercel); `components/update-notice.tsx` compara com
  `/api/version` a cada minuto e quando a aba volta ao foco.
- Os dados só atualizam após uma ação ou ao clicar em "Atualizar" (sem realtime).

## Convenções

- Idioma: comentários, mensagens de erro/log e commits em **português**; a UI
  mistura PT e EN (prefira PT em textos novos para o usuário).
- Commits no estilo Conventional Commits (`feat:`, `fix:`, `chore:`).
- **Nova operação de dados:** crie/estenda uma rota em `app/api`, envolva com
  `route(...)`, valide o corpo com `readJson(request, schemaZod)`, cheque
  permissão com `requireUser(...)`, acesse o banco com `getSupabaseAdmin()` e
  passe o resultado por `check(...)`. Coloque regras de negócio em
  `lib/server/*`. No cliente, chame com `api()` dentro do `AuthProvider`.
- Nunca importe `lib/supabase-admin.ts` ou `lib/server/*` em componentes
  `"use client"`, e não use o cliente anon (`lib/supabase.ts`) em código novo.
- Rotas que fazem `GET` de dados devem ter `export const dynamic = "force-dynamic"`.
- Componentes de UI: reutilize `components/ui/*` (shadcn) e o tema MU definido
  em `app/globals.css` / `tailwind.config.ts` (`mu-gold`, `mu-electric`, etc.).
  Não edite `styles/globals.css` — ele não é usado.
- Para adicionar um componente shadcn: `pnpm dlx shadcn@latest add <nome>`
  (config em `components.json`).
- Use pnpm; ao adicionar dependência, fixe uma versão (nunca `"latest"`) e
  prefira versões publicadas há pelo menos 2 semanas.
- Vulnerabilidades: rode `pnpm audit`. Correções em dependências indiretas
  ficam em `pnpm.overrides` no `package.json`, sempre dentro da mesma major.
  Ao atualizar o pacote que puxa a dependência, verifique se o override ainda
  é necessário e remova-o se não for.
- Antes de terminar uma mudança, rode `npx tsc --noEmit` e `pnpm build`.
  Hoje existem 15 erros de tipo já conhecidos, todos em
  `components/ui/{calendar,chart,resizable}.tsx` (não usados); não introduza
  erros novos fora deles.

## Deploy (ordem importa)

- A Vercel publica **todo push** de qualquer branch (preview) e usa como
  install command `pnpm install && pnpm run migrate:up`, com o `DATABASE_URL`
  de **produção**.
- `scripts/migrate-up.mjs` só roda as migrations quando `VERCEL_ENV` é
  `production`; em preview elas são ignoradas. **Nunca** troque o
  `migrate:up` de volta para chamar o `node-pg-migrate` direto.
- Consequência: um preview de branch com migrations novas roda contra um banco
  que ainda não as tem (pode dar erro no preview; a produção não é afetada).
- Toda migration que vai para a `main` é aplicada no build de produção, antes
  do código novo ficar no ar. Migrations que quebram a versão antiga (ex.:
  `lock-public-tables`) precisam de um plano de publicação combinado com o
  dono do projeto.
- Ao aplicar uma migration à mão (SQL Editor), registre-a em `pgmigrations`;
  se o `insert` der `duplicate key`, a sequência está atrasada:
  `select setval('pgmigrations_id_seq', (select max(id) from pgmigrations));`.

## Problemas conhecidos (backlog de correções)

Resolvidos na branch de segurança: autenticação no cliente, banco aberto para a
anon key, hash de senha fraco, senha padrão sem troca obrigatória, upload que
confiava no `userId` do cliente, dependências com CVEs (Next 15.2 → 15.5.28,
React 19.1.10, zod 4) e dependências com versão `"latest"`.

### Segurança

1. Sem limite de tentativas de login (brute force). Considerar rate limit.
2. `pnpm audit` ainda aponta 4 avisos **moderados** em `glob`/`minimatch`,
   puxados por `tailwindcss` (sucrase) e `node-pg-migrate`. São ferramentas de
   build/CLI (não rodam no site em produção) e a correção só existe em majors
   novas dessas libs; resolve-se ao migrar para Tailwind 4 / node-pg-migrate 9.

### Lógica de filas

3. Reordenações (`removePerson`, `moveToEnd`, `changePosition` em
   `lib/server/queues.ts`) não são atômicas: vários `update` em sequência.
   Ações simultâneas de dois masters ou uma falha no meio deixam posições
   duplicadas/buracos. Não há constraint `UNIQUE (queue_id, position)`.
   Ideal: função Postgres (RPC) em transação.
4. Itens `waiting` e `approved` compartilham a mesma sequência de `position`,
   mas `changePosition` só reordena os `approved` e `approve` não renumera —
   as posições ficam inconsistentes.
5. `moveToEnd` só funciona se o item estiver na posição 1.
6. `listQueues` busca **todos** os `queue_items` de todas as filas; não há
   realtime.
7. Trocar o nome no perfil não atualiza o nome copiado em `queue_items.name`.

### Infra / qualidade

8. `next.config.mjs` ignora erros de TypeScript e ESLint no build.
9. ESLint não está instalado, então `pnpm lint` não funciona.
10. Os tipos de `calendar`, `chart` e `resizable` estão quebrados (versões
    novas de react-day-picker, recharts e react-resizable-panels). Os
    componentes não são usados; dá para removê-los junto com as dependências.
11. ~~`migrate:reset` apontava para `database/migrationss`~~ (corrigido).
12. As 5 migrations originais têm `down` vazio (rollback não funciona).
13. Código morto/duplicado: `styles/globals.css`, `hooks/*` duplicando
    `components/ui/use-*`, sistema de drops desativado, dezenas de componentes
    shadcn não usados.
14. Sem testes automatizados.
15. `package.json` ainda se chama `my-v0-project`; `<html lang="en">` com UI
    em português; logo carregado de um domínio externo (37games).
16. Faltam índices nas FKs `queue_items.queue_id`, `queue_items.requested_by`
    e `queues.created_by` (apontado pelo advisor do Supabase).
17. Apagar um usuário que tenha `drop_events` falha (FK sem cascade).
