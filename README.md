# English Journal

English pronunciation journal and practice environment focused on guided
practice, review loops, offline resilience, and AI-assisted coaching.

## What the app includes

- Daily practice flows and review sessions
- Essential Words (high-frequency NGSL) with spaced repetition, weak forms, and an SRS vault (snooze / mastered)
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
| `CRON_SECRET` | Shared secret protecting the scheduled enrichment worker |
| `NEXT_PUBLIC_SITE_URL` | Optional deployed site URL for auth redirects |
| `GEMINI_API_KEY` | Server-only Gemini API credential |
| `GEMINI_ENABLE_PREVIEW_MODELS` | Optional fallback-chain flag for testing preview models |

The Gemini fallback chain already uses the stable alias `gemini-flash-latest`
before any preview-only models are considered. That keeps minor provider
updates out of app code unless you deliberately pin a fixed model ID.

Without valid Supabase or Gemini credentials, some authenticated and AI-backed
flows will be unavailable. The app still contains local/offline-oriented state
paths for parts of the practice experience.

## Production Notes

- Migration safety checks run with `pnpm check:migrations`.
- RLS coverage checks run with `pnpm audit:rls`.
- Global security headers, including CSP, are configured in `next.config.mjs`.
- API cost controls use the `consume_rate_limit` Supabase RPC and require `SUPABASE_SERVICE_ROLE_KEY` in production.
- Service-role Supabase clients are centralized through `lib/supabase/service-role.ts` and `lib/supabase/admin.ts`; route code should not create ad-hoc service-role clients.
- Word enrichment is queued in `word_enrichment_jobs`; run `processWordEnrichmentJobs()` from a trusted worker or scheduled job.
- Speech transcription caches are scoped per user and backed by Supabase (`stt_transcription_cache` and `sentence_transcription_cache`) with short-lived in-memory L1 caches.
- Practice progress uses the Dexie `syncOutbox` for retryable writes. Generic practice sessions, Reader, the daily checklist, and Essential Words activity show or preserve pending/error state instead of promising remote sync before flush.
- Gemini and speech transcription errors are normalized before reaching UI. User-facing copy should stay public and provider-neutral.
- Operational deployment notes live in `docs/deployment/runbook-minimo.md`.
- Security, sync, and environment ownership are documented in `docs/security/threat-model.md`, `docs/architecture/offline-sync.md`, and `docs/deployment/environments.md`.

## Current Limitations

- Offline support is not a full multi-device sync guarantee. Dexie/local queues cover selected client workflows; Supabase remains the source of truth after reconnect. Some short-lived buffers, such as Essential Words pending lapses, are session-scoped only.
- Gemini-backed features require server credentials and may degrade or queue when the provider is unavailable.
- Background word enrichment is drained every two hours by `.github/workflows/drain-enrichment.yml`; configure `ENRICHMENT_DRAIN_URL` and the shared `CRON_SECRET` in GitHub before relying on it. Manual dispatch remains available for immediate processing.
- Supabase migrations must be reviewed and applied deliberately; this repo does not auto-apply production SQL from the app server.

## Common commands

```bash
pnpm dev
pnpm lint
pnpm type-check
pnpm test
pnpm test:watch
pnpm lint:design-tokens
pnpm build
pnpm check:migrations
pnpm audit:rls
pnpm test:integration
pnpm validate:essential-words
pnpm validate:essential-words-generators
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
