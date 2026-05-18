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

## Acesso de exemplo (desenvolvimento)

A API precisa de dados de seed (`api-makeplay`: `npm run prisma:seed`) e, para login por telefone, `AUTH_DEV_MODE=true` (e opcionalmente `AUTH_DEV_PASSWORD=123456`).

Abre [http://localhost:3000/login](http://localhost:3000/login) e usa **telefone + senha**:

| Utilizador | Telefone | Senha |
|------------|----------|-------|
| João Silva (organizador principal) | `+55 11 98765-4321` | `123456` |
| Ana Costa | `+55 11 97654-3210` | `123456` |
| Bruno Mendes | `+55 11 96543-2109` | `123456` |
| Diego Santos | `+55 21 99876-5432` | `123456` |

Também podes entrar com **Google** (Firebase configurado no `.env.local`).

**Convite de teste** (sem login): após o seed, algo como `/invite/DEMO2026` — o código exacto aparece no output do `prisma:seed`.

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
