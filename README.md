# English Journal

**A personal environment for practising English pronunciation — record yourself, get meaningful AI feedback, and watch real progress build over time.**

🔗 **Live app:** [pronunciation-journal.vercel.app](https://pronunciation-journal.vercel.app/)

---

## What it is

English Journal is a web app for anyone who wants to speak English more clearly —
from absolute beginners to advanced learners polishing the fine details of stress,
rhythm, and connected speech. You don't need to know any phonetics to benefit from it.

Instead of being a collection of disconnected exercises, the app works as **one
connected learning loop**: short lessons introduce an idea, guided practice lets you
work on it out loud, the words and phrases you save capture what *you* care about,
and a daily plan decides what deserves your attention next. Progress is only ever
credited from real, evaluated practice — never from streaks, logins, or activity for
its own sake.

## What you can do with it

- **Practise out loud** with structured exercises: minimal pairs, dictation,
  fill-in-the-blank, and spoken "missions" (job interviews, everyday situations).
- **Get AI coaching** on your recordings — specific feedback on the sounds you
  actually struggle with, not generic praise.
- **Build vocabulary that sticks** with the Essential Words trainer, based on the
  most frequent words in English and a spaced-repetition review system.
- **Learn the mechanics** through a course path, mini-lessons, and grammar decks.
- **Keep a personal word & phrase collection** and let the app resurface it at the
  right moment.
- **See honest progress** — a skill profile that reflects evidence over time.
- **Keep practising offline.** The app is installable (PWA) and core practice
  keeps working without a connection, syncing back when you reconnect.

## Design intent

The app is meant to feel like a calm, attentive companion you return to willingly —
not a gamified tool that nags you. It takes pronunciation seriously without making
the learner feel tested, and it treats every user as an adult. Once you're in a
practice session, nothing interrupts it.

---

## For engineers

### Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS v4 with a design-token system |
| Auth & cloud data | Supabase (Postgres + RLS on every table) |
| Offline / local state | Dexie (IndexedDB) with a background sync outbox |
| Client state | Zustand (ephemeral UI only) |
| AI | Google Gemini via server-only API routes, with a model fallback chain |
| Spaced repetition | `ts-fsrs` (FSRS) client-side |
| Testing | Vitest + Testing Library; Playwright for a11y |
| Delivery | PWA (Serwist) with offline fallback |

### Architecture highlights

- **Strict layering.** UI never touches Supabase directly — all data access goes
  through `lib/*/queries.ts`. No AI prompt strings live in components; they're all
  in `lib/ai-prompts.ts`. Pages route and compose only, no business logic.
- **Offline-first sync.** Practice writes go through a Dexie `syncOutbox` with
  retryable delivery to Supabase, which stays the source of truth after reconnect.
- **One learning loop, honest signals.** Each user action contributes only the
  signal it can support (reading = exposure, evaluated practice = evidence).
  Mastery is never inferred from navigation or activity volume. Contract:
  [`docs/architecture/integrated-learning-loop.md`](docs/architecture/integrated-learning-loop.md).
- **Guardrails as code.** ESLint rules and audit scripts enforce the hard rules
  above (`pnpm audit:hard-rules`), plus RLS coverage checks, migration safety
  checks, secret scanning, and design-token linting.
- **Security.** Global security headers including CSP in `next.config.mjs`;
  `service_role` never reaches the client; per-user scoping on caches; API cost
  controls via a Supabase rate-limit RPC.

### Repository layout

```text
app/         Next.js routes, layouts, API handlers, styles
components/  UI and feature components (by domain)
lib/         Domain logic, data access, practice engines, SRS, AI
hooks/       Stateful orchestration
store/       Dexie useLiveQuery bindings (reactive IndexedDB → React)
scripts/     Validation, enrichment, and maintenance tooling
docs/        Architecture, deployment, design system, product notes
supabase/    Migrations and edge functions
public/      Static assets, sounds, PWA files
```

### Running locally

Requires Node 24.x and pnpm 11.

```bash
pnpm install
cp .env.example .env.local   # then fill in Supabase + Gemini credentials
pnpm dev                      # http://localhost:3000
```

Without Supabase/Gemini credentials, authenticated and AI-backed flows are
unavailable, but local/offline practice paths still run. Environment variables are
documented in `.env.example`; operational notes live in
[`docs/deployment/`](docs/deployment/).

### Verification

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm lint:design-tokens
pnpm build
```

### Further reading

- [Contributor and agent rules](CLAUDE.md)
- [Engineering standards](ENGINEERING_STANDARDS.md)
- [Product direction](PRODUCT.md)
- [Documentation index](docs/README.md)

## License and attribution

Sound files under `public/sounds/` are licensed under
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). Attribution
belongs to the respective works of Peter Isotalo, User:Erutoon,
User:TFighterPilot, and User:Adamsa123
