# Plan 065: Convertir Words, Dictionary y Tracking en repaso accionable sin fingir dominio

> **Executor instructions**: Mantén separadas las señales `saved`, `familiar`, `objective_evidence` y `mastered`. Reutiliza el engine de práctica; no crees un segundo scheduler. Actualiza la fila 065 al terminar.
>
> **Drift check (run first)**: `git diff --stat c779781b..HEAD -- plans/058-tracking-saved-content.md lib/tracking hooks/useTracking.ts components/tracking hooks/useLexiconPracticeSession.ts lib/word-bank lib/practice lib/practice/daily-plan`
> Plan 058 está en implementación no committeada; compara su estado real antes de tocar estos archivos y preserva el trabajo del owner.

## Status

- **Priority**: P2 product/pedagogy
- **Effort**: M
- **Risk**: MED
- **Depends on**: 058, 061, 062, 063, 066
- **Category**: direction, bug
- **Planned at**: commit `c779781b`, 2026-07-19
- **Current status**: DONE (2026-08-10: Plan 073 closed phrase practice with explicit registry refs when authored and honest activity-only shadowing otherwise; no target guessing or parallel SRS namespace)

## Why this matters

Words y Dictionary sí llegan al engine de práctica en varios recorridos, pero “known” puede convertir autoevaluación en `mastered` por 30 días. Tracking guarda frases/lecciones, pero su CTA suele ir al hub genérico y una frase guardada no se transforma en una práctica concreta. Guardar/familiaridad deben priorizar qué practicar, no demostrar que ya se aprendió.

## Current state

- **Resuelto:** `lib/word-bank/srs-queries.ts` conserva `known` como familiaridad y fecha de verificación cercana; ya no escribe `mastered`.
- `hooks/useLexiconPracticeSession.ts:205` todavía puede terminar tras autoevaluación, pero el resultado queda separado de la evidencia objetiva y la promoción SRS.
- **Resuelto:** `lib/word-bank/server-queries.ts` y el perfil de progreso distinguen dominio objetivo, familiaridad, evidencia y filas legacy.
- **Resuelto:** `hooks/useTracking.ts` y `components/tracking/TrackingClient.tsx` crean una cola exacta; frases sin target se practican como shadowing no-SRS y las refs explícitas conservan su owner canónico.
- Plan 058 conserva palabras en `word_bank` y frases/lecciones en `tracked_items`; esa frontera es correcta y no debe duplicarse.
- **Señal consumida**: la producción hablada de una frase guardada (Step 3, vía `SpokenAttempt` del plan 063) solo se scorea con `stt_intelligibility` (reconocimiento de palabras vía STT). No hay score acústico de fonema/stress/ritmo/intonation hasta la decisión del plan-071 benchmark. `objective_evidence` en la modalidad de producción significa "inteligible en STT", no "pronunciación correcta a nivel fonema".

## Target contract

- `saved`: intención/bookmark; prioriza acceso, no afecta mastery.
- `familiar`: autoevaluación conceptual; programa una verificación cercana.
- `objective_evidence`: resultado de recall/comprehension/production con target canónico.
- `mastered`: estado derivado de evidencia repetida y espaciada, no de un solo botón.
- Tracking adapta ítems guardados al engine existente y produce la misma evidencia canónica que el resto.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Tracking | `pnpm exec vitest run lib/tracking hooks/__tests__/useTracking* components/tracking` | pass |
| Dictionary/Words | `pnpm exec vitest run hooks/__tests__/useLexiconPracticeSession.test.tsx lib/word-bank lib/lexicon lib/practice` | pass |
| Typecheck | `pnpm type-check` | exit 0 |

## Scope

**In scope**: familiarity state/transition, objective verification queue, tracked-item practice adapter, phrase listen/speak/context exercises, lesson bookmark routing, small bounded Daily priority and focused tests.

**Out of scope**: duplicating `word_bank`; a new SRS algorithm; auto-completing bookmarked lessons; making all saved items mandatory daily; UI redesign; acoustic scoring (deferred to the plan-071 benchmark decision).

## Git workflow

- Branch: `codex/065-tracking-review` after plan 058 is committed/reconciled.
- Suggested commit `feat(tracking): turn saved content into verified review`.
- Stage only scoped files.

## Steps

### Step 1: Replace `known → mastered` with familiarity

Persist self-report as familiarity/confidence metadata. Schedule a short objective verification instead of a 30-day mastered interval. Preserve existing mastered rows but mark provenance/version so reports can distinguish legacy self-report from objective mastery.

**Verify**: tapping known produces `familiar` plus a due verification; it does not increment objective accuracy or mastery.

**Implementation**: `word_bank.familiarity_*`, `verification_due_at` and explicit mastery provenance are persisted by the new local migration; manual ratings no longer write `mastered`.

### Step 2: Require objective evidence for promotion

Define promotion rules using at least spaced objective observations and modality coverage appropriate to the target. A word may separately track meaning recall, contextual use and spoken production; do not collapse these into one perfect label.

**Verify**: tests show self-report only never masters; repeated verified results promote; a lapse returns the target to review per current scheduler invariants.

**Implementation**: objective answers carry modality metadata through `answer_history`/`srs_rating_events`; the RPC requires repeated passing evidence before objective mastery.

### Step 3: Build a tracked-item practice adapter

Create one adapter from the active Tracking filter to existing exercise/session inputs:

- word → saved word UUID and existing word exercises;
- phrase → listen/model, contextual recall and optional `SpokenAttempt` from plan 063, whose target ids resolve through the registry from plan 066 (do not invent a local target namespace);
- lesson → open exact lesson or its topic review; bookmark is not completion.

Reject unknown/deleted refs with an actionable skipped-item result; never route the whole selection blindly to `/practice`.

**Verify**: `pnpm exec vitest run lib/tracking` proves a mixed selection resolves canonical (registry-066) targets, creates a session from supported items and reports unsupported items without corrupting SRS.

**Implementation**: word, lesson and phrase adapters are active. Plain phrases produce activity-only shadowing; authored pronunciation/topic refs route to their existing owners. No `tracked_items` SRS namespace is invented.

### Step 4: Make “Repasar” launch the exact filtered queue

Pass a stable queue/session id to the practice route or dedicated adapter route, recover it offline from Dexie and record results through `savePracticeAnswer`/`recordActivitySession`. Preserve the filter's order only as presentation; adaptive ordering may use due/weak evidence.

**Verify**: `pnpm exec vitest run lib/tracking hooks/__tests__/useTracking*` proves phrase filter launches those phrases, word filter launches those words, lesson filter opens exact refs, and reload/offline recovery works. The evidence written by `savePracticeAnswer`/`recordActivitySession` inherits the per-user isolation from plan 060 (user-leading key, no cross-account leakage) — add a two-account (A→sign out→B) assertion that B never sees A's tracked-review evidence.

**Implementation**: `/tracking/review?session=<id>` restores the user-scoped queue from Dexie and routes lessons/phrases to their exact refs. Stale refs are skipped explicitly and never guessed from text.

### Step 5: Add a bounded Daily priority signal

Only after on-demand review works, allow at most 1-2 saved/familiar targets to enter Daily as a tie-breaker/quota. Do not change SM-2 due dates and do not crowd out due weak targets. Record the reason shown to the learner (“Guardaste esta frase”).

**Verify**: composer tests prove due items win, quota is bounded and saved items do not duplicate an already selected target.

**Implementation**: Daily selects due/verification-due words first, then at most two saved/familiar tiebreaks, without writing SRS state.

### Step 6: Update progress language

Reports must show saved/familiar/verified/mastered distinctly. Avoid promising “garantizar aprendizaje”; communicate evidence such as retained after N spaced checks or intelligible in N new phrases. For spoken-production evidence, phrase it strictly as intelligibility (“inteligible en STT”), never as phoneme accuracy or a pronunciation score. **Gate any new pronunciation-adjacent progress copy behind a feature flag** so it can be reverted without a data migration if the plan-071 decision retires acoustic-adjacent claims; the stored provenance/signal fields stay unflagged.

**Verify**: `pnpm exec vitest run lib/word-bank lib/tracking` proves progress/query tests use objective provenance for mastery counts; a UI copy snapshot test contains no self-report-as-mastery claim and no phoneme-accuracy phrasing, and with the copy flag off no pronunciation-level claim renders.

**Implementation**: progress signals and labels are separate, legacy mastery is marked pending verification, and STT-adjacent copy is feature-flagged.

## Test plan

- Add word-state tests for saved, familiar, verification due, objectively mastered and lapse.
- Add tracked-queue tests for each filter, mixed refs, deleted refs, offline reload and duplicate targets.
- Add Daily composer tests for quota, due-item precedence and deduplication.
- Verification: both focused Vitest commands and typecheck pass.

## Done criteria

- [x] `known` no longer immediately means objectively mastered.
- [x] Tracking review launches the exact filtered content.
- [x] Saved phrases can be practiced orally; only explicit canonical refs affect learning state.
- [x] Bookmarked lessons remain distinct from completion.
- [x] Daily boost is bounded and never changes SRS intervals.
- [x] Progress distinguishes familiarity from verified mastery.
- [x] Focused tests and typecheck pass. (Local Supabase lint reaches Postgres and reports no migration-specific error; the new migration is still pending in the local migration list, so no DDL/RLS reset validation is claimed.)

## STOP conditions

- Plan 058 has overlapping uncommitted edits that cannot be isolated; ask the owner before proceeding.
- A tracked ref cannot map to canonical content identity; skip/report it instead of guessing.
- Product wants self-report to remain equivalent to mastery; surface the metric integrity tradeoff.
- Daily quota displaces due SRS work in tests; fix composer policy before shipping.
- Any tracked-review feedback would label STT intelligibility as phoneme/pronunciation accuracy; keep spoken-production evidence as intelligibility until the plan-071 benchmark decides.

## Maintenance notes

Bookmarks are an intent signal. Keep them as scheduler input with a bounded weight, never as the source of truth for learning outcomes.
