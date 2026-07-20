# Plan 065: Convertir Words, Dictionary y Tracking en repaso accionable sin fingir dominio

> **Executor instructions**: Mantén separadas las señales `saved`, `familiar`, `objective_evidence` y `mastered`. Reutiliza el engine de práctica; no crees un segundo scheduler. Actualiza la fila 065 al terminar.
>
> **Drift check (run first)**: `git diff --stat c779781b..HEAD -- plans/058-tracking-saved-content.md lib/tracking hooks/useTracking.ts components/tracking hooks/useLexiconPracticeSession.ts lib/word-bank lib/practice lib/practice/daily-plan`
> Plan 058 está en implementación no committeada; compara su estado real antes de tocar estos archivos y preserva el trabajo del owner.

## Status

- **Priority**: P2 product/pedagogy
- **Effort**: M
- **Risk**: MED
- **Depends on**: 058, 061, 062, 063
- **Category**: direction, bug
- **Planned at**: commit `c779781b`, 2026-07-19

## Why this matters

Words y Dictionary sí llegan al engine de práctica en varios recorridos, pero “known” puede convertir autoevaluación en `mastered` por 30 días. Tracking guarda frases/lecciones, pero su CTA suele ir al hub genérico y una frase guardada no se transforma en una práctica concreta. Guardar/familiaridad deben priorizar qué practicar, no demostrar que ya se aprendió.

## Current state

- `lib/word-bank/srs-queries.ts:72` convierte `known` directamente en `srs_status: mastered` y posterga 30 días.
- `hooks/useLexiconPracticeSession.ts:205` puede terminar tras autoevaluación si no se declararon olvidadas, sin evidencia objetiva.
- `lib/word-bank/server-queries.ts:53` cuenta ese estado como dominio.
- `hooks/useTracking.ts:28` solo da `href` a lecciones; frases guardadas no tienen destino de práctica.
- `components/tracking/TrackingClient.tsx:40` manda palabras/frases a `/practice` genérico; no construye una cola con los ítems filtrados.
- Plan 058 conserva palabras en `word_bank` y frases/lecciones en `tracked_items`; esa frontera es correcta y no debe duplicarse.

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

**Out of scope**: duplicating `word_bank`; a new SRS algorithm; auto-completing bookmarked lessons; making all saved items mandatory daily; UI redesign; acoustic scoring beyond plan 064.

## Git workflow

- Branch: `codex/065-tracking-review` after plan 058 is committed/reconciled.
- Suggested commit `feat(tracking): turn saved content into verified review`.
- Stage only scoped files.

## Steps

### Step 1: Replace `known → mastered` with familiarity

Persist self-report as familiarity/confidence metadata. Schedule a short objective verification instead of a 30-day mastered interval. Preserve existing mastered rows but mark provenance/version so reports can distinguish legacy self-report from objective mastery.

**Verify**: tapping known produces `familiar` plus a due verification; it does not increment objective accuracy or mastery.

### Step 2: Require objective evidence for promotion

Define promotion rules using at least spaced objective observations and modality coverage appropriate to the target. A word may separately track meaning recall, contextual use and spoken production; do not collapse these into one perfect label.

**Verify**: tests show self-report only never masters; repeated verified results promote; a lapse returns the target to review per current scheduler invariants.

### Step 3: Build a tracked-item practice adapter

Create one adapter from the active Tracking filter to existing exercise/session inputs:

- word → saved word UUID and existing word exercises;
- phrase → listen/model, contextual recall and optional `SpokenAttempt` from plan 063;
- lesson → open exact lesson or its topic review; bookmark is not completion.

Reject unknown/deleted refs with an actionable skipped-item result; never route the whole selection blindly to `/practice`.

**Verify**: a mixed selection resolves canonical targets, creates a session from supported items and reports unsupported items without corrupting SRS.

### Step 4: Make “Repasar” launch the exact filtered queue

Pass a stable queue/session id to the practice route or dedicated adapter route, recover it offline from Dexie and record results through `savePracticeAnswer`/`recordActivitySession`. Preserve the filter's order only as presentation; adaptive ordering may use due/weak evidence.

**Verify**: phrase filter launches those phrases, word filter launches those words, lesson filter opens exact refs; reload/offline works.

### Step 5: Add a bounded Daily priority signal

Only after on-demand review works, allow at most 1-2 saved/familiar targets to enter Daily as a tie-breaker/quota. Do not change SM-2 due dates and do not crowd out due weak targets. Record the reason shown to the learner (“Guardaste esta frase”).

**Verify**: composer tests prove due items win, quota is bounded and saved items do not duplicate an already selected target.

### Step 6: Update progress language

Reports must show saved/familiar/verified/mastered distinctly. Avoid promising “garantizar aprendizaje”; communicate evidence such as retained after N spaced checks or intelligible in N new phrases.

**Verify**: progress/query tests use objective provenance for mastery counts; UI copy snapshot contains no self-report-as-mastery claim.

## Test plan

- Add word-state tests for saved, familiar, verification due, objectively mastered and lapse.
- Add tracked-queue tests for each filter, mixed refs, deleted refs, offline reload and duplicate targets.
- Add Daily composer tests for quota, due-item precedence and deduplication.
- Verification: both focused Vitest commands and typecheck pass.

## Done criteria

- [ ] `known` no longer immediately means objectively mastered.
- [ ] Tracking review launches the exact filtered content.
- [ ] Saved phrases can be practiced in context and orally.
- [ ] Bookmarked lessons remain distinct from completion.
- [ ] Daily boost is bounded and never changes SRS intervals.
- [ ] Progress distinguishes familiarity from verified mastery.
- [ ] Focused tests and typecheck pass.

## STOP conditions

- Plan 058 has overlapping uncommitted edits that cannot be isolated; ask the owner before proceeding.
- A tracked ref cannot map to canonical content identity; skip/report it instead of guessing.
- Product wants self-report to remain equivalent to mastery; surface the metric integrity tradeoff.
- Daily quota displaces due SRS work in tests; fix composer policy before shipping.

## Maintenance notes

Bookmarks are an intent signal. Keep them as scheduler input with a bounded weight, never as the source of truth for learning outcomes.
