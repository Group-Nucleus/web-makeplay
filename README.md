# web-makeplay

Frontend web do BoraPlay em **Next.js** (App Router + Tailwind). Consome a mesma API que o app Expo (`api-makeplay`).

## Setup

```bash
cd web-makeplay
cp .env.example .env.local
pnpm install   # ou npm install
pnpm dev
```

Configure `NEXT_PUBLIC_API_URL` (recomendado: `/v1` — proxy no `next.config.ts` para `api-makeplay`).

**Vercel:** use `NEXT_PUBLIC_API_URL=/v1` (não a URL absoluta do Render), senão o browser bloqueia por CORS.

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Início — grupos semanais e jogos avulsos |
| `/explore` | Explorar jogos, jogadores e quadras |
| `/profile` | Perfil do utilizador (layout web) |
| `/match/[id]` | Detalhe da partida (`?code=` para convite) |
| `/invite/[code]` | Redireciona para `/match/[id]?code=` |
| `/login` | Login telefone + senha |

## Estrutura

- `lib/` — API client, repositórios, mappers, auth (sessão em `localStorage`)
- `components/` — páginas e UI (Tailwind, tema BoraPlay)
- `app/` — rotas Next.js

## Sessão

JWT + utilizador guardados no `localStorage`. Ao recarregar, a sessão é restaurada via `GET /users/me`.
