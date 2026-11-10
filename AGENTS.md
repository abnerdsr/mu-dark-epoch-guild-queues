# AGENTS.md

Guia para agentes de IA (e humanos) que trabalham neste repositório.

## Visão geral

**MU Dark Epoch – Guild Queues** é um sistema web para controlar as filas de
loot de bosses de uma guild do jogo MU Dark Epoch. Cada fila representa um item
(ex.: uma asa, uma joia) e mantém a ordem de quem é o próximo a receber.

- Usuários comuns (`role = "user"`) pedem para entrar numa fila; o pedido fica
  como `waiting` até um master aprovar.
- Masters (`role = "master"`) criam/editam/apagam filas, aprovam pedidos,
  adicionam/removem pessoas, mudam posições, mandam o primeiro para o fim da
  fila e gerenciam usuários.
- Existe um sistema de "drops" (`drop_events` / `drop_participants`) que hoje
  está **desativado na UI** (`<DropManagementPanel />` comentado em
  `app/page.tsx`), mas o `DropProvider` continua montado e consultando o banco.

O projeto foi iniciado no v0 (Vercel), por isso há muitos componentes shadcn/ui
gerados que não são usados.

## Stack

| Camada        | Tecnologia                                                    |
| ------------- | ------------------------------------------------------------- |
| Framework     | Next.js 15 (App Router) + React 19                            |
| Linguagem     | TypeScript (`strict`), módulos ESM (`"type": "module"`)       |
| UI            | Tailwind CSS 3, shadcn/ui (Radix), lucide-react, next-themes  |
| Backend/dados | Supabase (Postgres + Storage) via `@supabase/supabase-js`     |
| Migrations    | `node-pg-migrate` (arquivos JS em `database/migrations`)      |
| Gerenciador   | **pnpm** (há `pnpm-lock.yaml`; não use npm/yarn)              |

## Comandos

```sh
cp .example.env .env      # preencher com os dados do Supabase
pnpm i                    # instalar dependências
pnpm run migrate:up       # criar tabelas (usa DATABASE_URL)
pnpm run migrate:new nome # nova migration em database/migrations
pnpm dev                  # servidor local em http://localhost:3000
pnpm build                # build de produção
npx tsc --noEmit          # checagem de tipos (o build NÃO checa, ver abaixo)
```

Não existem testes automatizados nem ESLint configurado (`pnpm lint` chama
`next lint`, mas o ESLint não está instalado).

Para rodar `pnpm build` sem um Supabase real, basta definir valores fictícios:

```sh
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy SUPABASE_SERVICE_ROLE_KEY=dummy pnpm build
```

### Variáveis de ambiente (`.example.env`)

| Variável                        | Uso                                                      |
| ------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`                  | Conexão Postgres usada pelo `node-pg-migrate`            |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL do projeto Supabase (exposta ao browser)             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon (exposta ao browser)                          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Chave service role, **somente servidor** (upload imagem) |
| `ENVIRONMENT`                   | Ambiente (`local`, …) — hoje não é lido pelo código      |

Nunca commite `.env` (já está no `.gitignore` via `.env*`).

## Estrutura

```
app/
  layout.tsx                 # layout raiz, ThemeProvider (tema dark fixo)
  page.tsx                   # única página; monta Auth/Drop providers e modais
  globals.css                # CSS global REAL (tema MU: cores mu-gold, mu-electric…)
  api/upload-image/route.ts  # POST/DELETE de imagens no bucket "queue-images"
components/
  auth-provider.tsx          # Context com estado global + TODA a lógica de dados
  drop-provider.tsx          # Context do sistema de drops (desativado na UI)
  queue-grid.tsx, queue-card.tsx, queue-edit-modal.tsx, create-queue-modal.tsx
  header.tsx, login-modal.tsx, profile-modal.tsx, user-management-modal.tsx
  image-upload.tsx
  drop-*.tsx, participant-selection-panel.tsx, name-action-card.tsx,
  picked-up-list.tsx, missed-list.tsx   # UI de drops (não usada hoje)
  ui/                        # shadcn/ui gerado (maioria não usada)
hooks/                       # use-toast / use-mobile (duplicados de components/ui)
lib/
  supabase.ts                # cliente Supabase (anon) + tipos das tabelas
  supabase-admin.ts          # cliente service role (só no servidor!)
  password-utils.ts          # hash de senha caseiro (ver Problemas conhecidos)
  utils.ts                   # cn()
database/migrations/         # users, queues, queue_items, drop_events, drop_participants
styles/globals.css           # cópia antiga do shadcn, NÃO é importada
```

Alias de import: `@/*` aponta para a raiz do repositório.

## Modelo de dados

- `users` — `id`, `username` (único), `name`, `password` (hash), `role`
  (`master` | `user`), `created_at`.
- `queues` — `id`, `title`, `item_name`, `image_url`, `created_by → users`.
- `queue_items` — `id`, `queue_id → queues`, `name`, `position` (1 = próximo),
  `status` (`waiting` | `approved` | `completed`), `requested_by → users`.
- `drop_events` — `queue_id`, `drop_count` (0–5), `created_by`.
- `drop_participants` — `drop_event_id`, `queue_item_id`, `name`,
  `action` (`accept` | `skip` | `decline`).

Os tipos TS correspondentes estão em `lib/supabase.ts`; `auth-provider.tsx`
converte `requested_by` → `requestedBy` para a UI. Se mudar o schema, atualize
a migration **e** esses tipos.

O bucket de Storage `queue-images` precisa existir no Supabase (não é criado
por migration).

## Como o app funciona hoje

- Tudo roda no **cliente** (`"use client"`): os componentes chamam
  `useAuth()`, que fala direto com o Supabase usando a chave anon.
- "Login" = buscar o usuário pelo `username`, comparar o hash da senha no
  browser e salvar o objeto do usuário em `localStorage["currentUser"]`.
  Não há Supabase Auth, cookie, JWT nem sessão no servidor.
- As permissões de master são checadas só no cliente
  (`if (user?.role !== "master") return`).
- Reordenação de fila é feita com vários `update` sequenciais no cliente.
- Os dados só atualizam após uma ação ou ao clicar em "refresh" (sem realtime).
- A única rota de servidor é `/api/upload-image`, que usa a service role.

## Convenções

- Idioma: comentários, mensagens de log e commits em **português**; a UI
  mistura PT e EN (prefira PT em textos novos para o usuário).
- Commits no estilo Conventional Commits (`feat:`, `fix:`, `chore:`).
- Componentes de UI: reutilize `components/ui/*` (shadcn) e o tema MU definido
  em `app/globals.css` / `tailwind.config.ts` (`mu-gold`, `mu-electric`, etc.).
  Não edite `styles/globals.css` — ele não é usado.
- Para adicionar um componente shadcn: `pnpm dlx shadcn@latest add <nome>`
  (config em `components.json`).
- Use pnpm; ao adicionar dependência, fixe uma versão (evite `"latest"`).
- Nunca importe `lib/supabase-admin.ts` em código cliente — ele usa a service
  role key e lança erro se ela não existir.
- Antes de terminar uma mudança, rode `npx tsc --noEmit` e `pnpm build`.
  Hoje existem 15 erros de tipo já conhecidos, todos em
  `components/ui/{calendar,chart,resizable}.tsx` (não usados); não introduza
  erros novos fora deles.

## Problemas conhecidos (backlog de correções)

Levantados na análise inicial, em ordem aproximada de prioridade.

### Segurança (crítico)

1. **Autenticação só no cliente.** O usuário logado é um JSON no
   `localStorage`; basta editar `role` para `"master"` no DevTools para ganhar
   acesso de master na UI.
2. **Banco aberto para a chave anon.** As migrations não habilitam RLS. Como a
   chave anon é pública (vai no bundle), qualquer pessoa pode ler a tabela
   `users` inteira (incluindo hashes de senha — `login` faz `select("*")`),
   promover-se a master, apagar filas e usuários direto pela API do Supabase.
3. **Hash de senha fraco.** `lib/password-utils.ts` é um hash de 32 bits não
   criptográfico (estilo Java `hashCode`), trivial de reverter/colidir.
   Trocar por Supabase Auth ou bcrypt/argon2 no servidor.
4. **Senha padrão = username** para usuários criados pelo master
   (`createUser`).
5. **`/api/upload-image` confia no `userId` enviado pelo cliente.** Qualquer um
   que saiba o id de um master (os ids aparecem na lista de usuários) pode
   enviar ou apagar imagens. Além disso, o arquivo sempre recebe extensão
   `.jpg` independentemente do tipo.

Direção sugerida: migrar para Supabase Auth (ou sessão própria com cookie
httpOnly), mover as mutações para Route Handlers / Server Actions com checagem
de role no servidor e habilitar RLS em todas as tabelas.

### Lógica de filas

6. Reordenações (`removePersonFromQueue`, `moveToEnd`, `changePosition`) não
   são atômicas: vários `update` em loop no cliente. Ações simultâneas de dois
   masters ou uma falha no meio deixam posições duplicadas/buracos. Não há
   constraint `UNIQUE (queue_id, position)`. Ideal: função Postgres (RPC) em
   transação.
7. Itens `waiting` e `approved` compartilham a mesma sequência de `position`,
   mas `changePosition` só reordena os `approved` e `approveRequest` não
   renumera — as posições ficam inconsistentes.
8. `moveToEnd` só funciona se o item estiver na posição 1.
9. `addPersonToQueue` usa `.single()` para checar duplicidade, que retorna erro
   (ignorado) quando não há linha — funciona por acaso.
10. `refreshQueues` busca **todos** os `queue_items` de todas as filas e filtra
    no cliente; não há realtime.

### Infra / qualidade

11. `next.config.mjs` ignora erros de TypeScript e ESLint no build.
12. ESLint não está instalado, então `pnpm lint` não funciona.
13. Muitas dependências com versão `"latest"` → builds não reproduzíveis;
    já quebraram os tipos de `calendar`, `chart` e `resizable` (react-day-picker
    v9, recharts v3, react-resizable-panels v4).
14. Script `migrate:reset` aponta para `database/migrationss` (erro de digitação).
15. Todas as migrations têm `down` vazio (rollback não funciona).
16. Código morto/duplicado: `styles/globals.css`, `hooks/*` duplicando
    `components/ui/use-*`, UI de drops desativada mas `DropProvider` ainda
    consultando `drop_events`/`drop_participants` no carregamento, dezenas de
    componentes shadcn não usados.
17. Sem testes automatizados.
18. `package.json` ainda se chama `my-v0-project`; `<html lang="en">` com UI
    em português; logo carregado de um domínio externo (37games).
