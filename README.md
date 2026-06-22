# English Journal

English pronunciation journal and practice environment focused on guided
practice, review loops, offline resilience, and AI-assisted coaching.

## What the app includes

- Daily practice flows and review sessions
- Course path, mini-lessons, and grammar study decks
- Lexicon, words, vocabulary, and pronunciation practice surfaces
- AI coach features backed by Gemini server routes
- Progress telemetry and SRS-oriented review mechanics
- PWA support with offline fallback and local persistence

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS v4
- Supabase for auth and cloud-backed data
- Dexie/IndexedDB for offline state and sync
- Gemini API for server-side AI features
- Zustand for client state
- Vitest and Testing Library for tests

## Requirements

- Node.js 24.x
- pnpm 11

## Quick start

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Copy `.env.example` to `.env.local` and replace placeholders. Never commit real
credentials.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL used by browser and server clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only access for privileged cache operations |
| `NEXT_PUBLIC_SITE_URL` | Optional deployed site URL for auth redirects |
| `GEMINI_API_KEY` | Server-only Gemini API credential |
| `GEMINI_ENABLE_PREVIEW_MODELS` | Optional fallback-chain flag for testing preview models |

Without valid Supabase or Gemini credentials, some authenticated and AI-backed
flows will be unavailable. The app still contains local/offline-oriented state
paths for parts of the practice experience.

## Common commands

```bash
pnpm dev
pnpm lint
pnpm type-check
pnpm test
pnpm test:watch
pnpm lint:design-tokens
pnpm build
pnpm validate:core1000
pnpm validate:core1000-generators
pnpm lexicon:enrich
```

## Project structure

```text
app/         Next.js routes, layouts, API handlers, styles
components/  UI and feature components
lib/         Domain logic, data access, practice engines, progress, SRS
scripts/     Validation, enrichment, and maintenance scripts
docs/        Architecture, deployment, design system, and product notes
supabase/    Supabase-related assets
public/      Static assets, sounds, and PWA files
```

## Verification

Run local verification with Node 24.x:

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm lint:design-tokens
pnpm build
```

## Project guidance

- [Contributor and agent rules](CLAUDE.md)
- [Engineering standards](ENGINEERING_STANDARDS.md)
- [Product direction](PRODUCT.md)
- [Documentation index](docs/README.md)

## License and attribution

Sound files under `public/sounds/` are licensed under
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Attribution
belongs to the respective works of Peter Isotalo, User:Erutoon,
User:TFighterPilot, and User:Adamsa123.
