# english-journal

Next.js 16 App Router · React 19 · Tailwind v4 · Supabase · Dexie.js · Gemini API · Zustand · Web Audio API

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm type-check   # TypeScript check (no emit)
pnpm lint         # ESLint
pnpm test         # Vitest (unit tests)
pnpm test:watch   # Vitest watch mode
```

> Test runner: **Vitest**. Test files live alongside source or in `__tests__/` subdirs.

## Hard rules

- No Gemini prompts inside components. All prompts → `lib/ai-prompts.ts`
- Gemini models: allowlisted Free Tier Lite first, at most 3 per chain, with a
  shared daily model reservation via `reserveModel`; 429s trigger a cooldown.
  UI calls Gemini through `/api/gemini/*`.
- All Supabase access → `lib/*/queries.ts`. No direct fetches from UI
- Never expose `service_role` on the client
- RLS required on every new table before merging
- No business logic inside `/app` pages. Pages route and compose only
- Persistent state → Dexie or Supabase. Zustand = ephemeral UI state only
- Never duplicate state between Dexie and Zustand
- Audio format: OGG/Opus. Storage path: `audio/{user_id}/{uuid}.ogg`
- TTS is never saved automatically
- New features must not break offline mode
- Ejercicios corregidos con IA → `gradeWithLocalFirst` (`lib/exercises/grading-pipeline.ts`),
  consumido desde los componentes vía `useProductionGrading` (máx. 2 correcciones por ejercicio)
- Ejercicios escritos (`sentence_transformation`, `error_correction`, `personalization`) deben usar
  calificador tolerante `matchAnswer` (`lib/exercises/answer-match.ts`) antes de cualquier IA
- Detección de estructuras gramaticales en respuestas escritas debe usar los detectores deterministas
  puros de `lib/exercises/structure-checks/` en lugar de LLMs
- No `any` without a comment explaining why

## Styling rules

> Full design-system rules (color, tarjetas, voz, componentes, accesibilidad):
> [`docs/design-system/RULES.md`](docs/design-system/RULES.md). Enforced by
> `npm run lint:design`.

- **Tailwind v4 utility classes only.** No inline `style={{}}` props. No CSS Modules. No styled-components.
- **Design tokens are CSS custom properties** defined in `globals.css`. Never hardcode colors, spacing, radii, or shadows — use the token.
- Use `cn()` (clsx + tailwind-merge) for all conditional class logic.
- `style={{}}` is only allowed for values computed at runtime (e.g. JS-driven animations, dynamic `--hue` overrides).
- Class order: layout → spacing → typography → color → state variants → responsive modifiers.
- Dark mode via `.dark` class on `<html>`. Never use `prefers-color-scheme` directly in components.

## Component rules

Before writing any component, list its sub-components as a comment block first.
Only then implement. If you cannot list them, the component is too large — split it.

```tsx
// Planned structure:
// <PracticeSession>
//   <PracticeHeader />
//   <QuestionCard />
//   <AnswerInput />
//   <PracticeFooter />
// </PracticeSession>
```

- One component = one responsibility. If a file has two distinct visual sections, split it.
- No component exceeds 250 lines. If you are approaching the limit, stop and decompose.
- No more than 8 props. More than 8 → decompose or use a context/store.
- Prefer composition over large prop surfaces.
- Prefer Server Components unless the feature requires heavy interaction
  (recording, live scoring, real-time chat).

## Before finishing any task

- [ ] No file exceeds 250 lines
- [ ] Each new component has a single clearly named responsibility
- [ ] No inline `style={{}}` unless runtime-computed
- [ ] No hardcoded colors, spacing, or radii — tokens only
- [ ] No prompt strings outside `lib/ai-prompts.ts`
- [ ] No Supabase calls outside `lib/*/queries.ts`
- [ ] New Supabase tables have RLS enabled
- [ ] Offline mode still works

## Folder structure

```
/app          → routing + API handlers only
/components   → UI by domain (incl. Dexie useLiveQuery reads)
/hooks        → stateful logic / orchestration (incl. Dexie useLiveQuery reads)
/lib          → domain, queries, AI, SRS, utils
/public       → assets, audio, illustrations
/lib/stores   → Zustand stores (ephemeral UI state only)
/lib/db       → Dexie schema, table definitions, lesson generators
/lib/sync     → outbox sync-manager (Dexie → Supabase background sync)
/types        → global TypeScript declarations
/supabase     → migrations and edge functions
/scripts      → data/content tooling (not deployed)
```

## Naming conventions

- Absolute imports from `@/`
- Explicit domain-scoped names: `PracticeHeader` not `Header2`, `useDeckSync` not `useData`
- Complex hooks stay separate from UI components

## Key lib domains

| Domain | Path | Notes |
| - | - | - |
| AI prompts | `lib/ai-prompts.ts` | All Gemini prompt strings — no inline prompts |
| Practice engine | `lib/practice/` | SRS session logic, grading, adapters |
| Essential Words | `lib/essential-words/` | High-frequency word queue + weak-form data |
| Phoneme practice | `lib/phoneme-practice/` | Contrast-based SRS, mastery, TTS |
| Sound lab | `lib/sound-lab/` | Audio display helpers |
| Sync | `lib/sync/` | Outbox sync-manager (Dexie → Supabase) |
| Offline downloads | `lib/offline/` | On-demand lesson download manager (Dexie v35 + CacheStorage) |
| Dexie DB | `lib/db/` | Schema, table defs, lesson generators |
| Zustand stores | `lib/stores/` | Ephemeral UI stores (e.g. `aiCoachStore`) |
| Supabase client | `lib/supabase/` | `client.ts`, `server.ts`, `auth-actions.ts` |

## State model

| Data                                | Where                                      |
|-------------------------------------|--------------------------------------------|
| Ephemeral UI (modals, tabs, panels) | Zustand (`lib/stores/`)                    |
| Auth, theme                         | React Context                              |
| User data (decks, fragments)        | Dexie ⇄ Supabase (via `lib/sync/`)        |
| Downloaded lessons (hybrid offline) | Dexie (`downloadedLessons`) + CacheStorage |
| Reactive IndexedDB reads            | `hooks/`/`components/` via Dexie `useLiveQuery` |
| System content                      | Supabase, cached in Dexie                  |

## Do not

- Hardcode prompts inline
- Fetch Supabase from UI directly
- Mix multiple domains in one component
- Write multipurpose hooks (`useEverything`)
- Use `localStorage` for critical data
- Use inline styles or CSS Modules — Tailwind tokens only
- Suggest replacing Dexie, SM-2 client-side, or Gemini-via-routes — already decided

## Architecture patterns

Query layer, Realtime, registries, ESLint guardrails, inventarios y rutas de referencia → **`ENGINEERING_STANDARDS.md`**.

Resumen mínimo:

- Supabase browser client → `lib/*/queries.ts` only (`AuthProvider` + `lib/auth/*` exempt)
- Realtime → `lib/<domain>/realtime.ts` + pure apply functions; hooks orchestrate only
- Many variants → registry + type guard, not long `if`/`switch` chains
- New exercise types → registry entry, never conditionals in `ExerciseRenderer`
- Prefer discriminated unions, type guards, centralized casts
- File size: components ≤250 lines (convention); ESLint warns at 300 — see allowlist in `ENGINEERING_STANDARDS.md`
