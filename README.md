# English Journal

English pronunciation journal and practice environment with deterministic
exercises, spaced repetition, offline support, and AI-assisted coaching.

## Stack

- Next.js 16 App Router and React 19
- Tailwind CSS v4
- Supabase for authentication and cloud data
- Dexie/IndexedDB for offline state and synchronization
- Gemini API for server-side AI features
- Zustand for client state
- Vitest for tests

## Requirements

- Node.js 24.x
- pnpm 11

## Quick start

```bash
pnpm i
Copy-Item .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and replace its placeholders. Never commit
real credentials.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used by browser and server clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only access for privileged cache operations |
| `NEXT_PUBLIC_SITE_URL` | Optional deployed site URL for authentication redirects |
| `GEMINI_API_KEY` | Server-only Gemini API credential |
| `GEMINI_ENABLE_PREVIEW_MODELS` | Optional fallback-chain feature flag; keep `false` for normal use |

## Verification

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm lint:design-tokens
pnpm build
```

Run local verification with Node 24.x, as required by `package.json`.

## Project guidance

- [Contributor and agent rules](CLAUDE.md)
- [Engineering standards](ENGINEERING_STANDARDS.md)
- [Product direction](PRODUCT.md)
- [Documentation index](docs/README.md)

## License and attribution

Sound files under `public/sounds/` are licensed under
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/) and are the
respective works of Peter Isotalo, User:Erutoon, User:TFighterPilot, and
User:Adamsa123.
