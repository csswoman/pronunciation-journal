# Plan 067: Construir un diagnóstico oral que prescriba la primera semana

> **Executor instructions**: Implementa un diagnóstico de pronunciación separado del placement gramatical. Usa únicamente señales que el evaluador realmente puede medir y etiqueta dimensiones no medidas. Sigue todos los gates y actualiza la fila 067 al terminar.
>
> **Drift check (run first)**: `git diff --stat 99c871cb..HEAD -- app/assessment app/api/assessment components/courses/AssessmentClient.tsx lib/courses/assessment* lib/courses/guest-assessment.ts lib/home/placement-state.ts lib/pronunciation components/pronunciation-assessment supabase/migrations lib/supabase/types.ts docs/architecture`
> Si el assessment o el contrato `SpokenAttempt` cambió, compara los extractos y detente si la identidad/evaluator kind ya no coincide.

## Status

- **Priority**: P1 product/pedagogy
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: plans/060-isolate-local-learning-data-by-user.md, plans/061-make-srs-and-outbox-transactional.md, plans/063-build-pronunciation-production-spine.md, plans/066-create-pronunciation-target-registry.md
- **Category**: direction, migration
- **Planned at**: commit `99c871cb`, 2026-07-20

## Why this matters

El placement actual mide gramática/reading y produce un CEFR general, pero no responde qué sonidos, patrones de ritmo o situaciones orales necesita el usuario. Un diagnóstico oral debe producir targets accionables y una primera semana de práctica, no otro score global. También debe funcionar honestamente cuando el navegador, micrófono o evaluador no permiten medir una dimensión.

## Current state

- `lib/courses/assessment-schema.ts:42` solo admite modes `placement|checkpoint`.
- `lib/courses/assessment.ts:38-137` construye preguntas autorales y reading de opción múltiple; no contiene prompts hablados.
- `components/courses/AssessmentClient.tsx:127` resume el resultado como “Acertaste X de Y preguntas” y recomienda lecciones gramaticales.
- `lib/courses/assessment-profile.ts` ya separa autoevaluación conceptual de evidencia objetiva y persiste `UserLearningState`; reutiliza ese patrón, no su schema.
- `lib/courses/guest-assessment.ts` y `/api/assessment/results` ofrecen precedentes de resultado invitado, validación Zod, same-origin, auth y rate limiting.
- Plan 063 define `SpokenAttempt`; plan 066 define target ids y capacidades. El diagnóstico debe consumir ambos contratos.
- **Señal consumida**: el diagnóstico solo puede scorear producción con `stt_intelligibility` (reconocimiento de palabras vía STT). Stress, ritmo e intonation NO reciben score acústico: se reportan como `not_measured` + autoobservación hasta que el plan-071 benchmark valide un evaluador (el 064 validó dirección, no habilitó evaluador de producción). Nunca 0/100 para dimensiones no medidas.

## Diagnostic v1 contract

- 8–12 minutos, cancelable y reanudable.
- Etapas: capability/privacy check, self-report oral, percepción de 2–3 contrastes, producción de palabras, producción de frases y una mini transferencia contextual.
- Resultados por target: `observed`, `needs_evidence`, `strength`, `priority`, con señal, confianza y evaluator version.
- STT v1 puede medir inteligibilidad/transcript match. Stress, ritmo e intonation solo reciben resultado acústico si el benchmark del plan 071 lo validó; de lo contrario aparecen como “aún no medido” más autoobservación, nunca como 0 o 100.
- Salida: máximo 3 prioridades y un `PronunciationWeekPrescription` de cinco sesiones cortas que el Daily pueda consumir sin duplicar SRS.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Diagnostic logic | `pnpm exec vitest run lib/pronunciation/assessment components/pronunciation-assessment` | all selected tests pass |
| API/persistence | `pnpm exec vitest run app/api/pronunciation-assessment/__tests__/route.test.ts lib/pronunciation/assessment/__tests__/persistence.test.ts` | both planned suites pass |
| Typecheck | `pnpm type-check` | exit 0 |
| Design tokens | `pnpm lint:design-tokens` | exit 0 |
| RLS integration | `pnpm test:rls:integration` | pass against local Supabase only |

## Suggested executor toolkit

- Use `supabase` for the new table/RLS workflow; run local preflight only unless the owner separately authorizes linked production changes.
- Use `better-ui` and `web-design-guidelines` for the assessment flow after reading `PRODUCT.md`, `DESIGN.md`, `THEME_SYSTEM.md` and `docs/design/visual-language.md`.

## Scope

**In scope**:
- New `/assessment/pronunciation` route and `components/pronunciation-assessment/*`.
- New `app/api/pronunciation-assessment/route.ts` with auth, same-origin, rate limit and Zod validation matching the existing assessment route.
- Pure prompt selection/scoring/prescription modules under `lib/pronunciation/assessment/`.
- A versioned `pronunciation_assessments` entity, RLS, generated types and outbox/guest-transfer support.
- Home/Courses entry points that distinguish CEFR placement from oral diagnostic.
- Focused unit, component, API and RLS tests plus architecture docs.

**Out of scope**:
- Modifying grammar placement results or deriving CEFR from pronunciation.
- Requiring raw-audio retention; persist transcript/derived evidence only by default.
- Acoustic stress/rhythm/intonation scoring unless the plan-071 benchmark chose ship/partial-ship.
- A long comprehensive exam or a single “pronunciation level”.
- Applying a production migration without explicit authorization.

## Git workflow

- Branch: `codex/067-pronunciation-diagnostic`.
- Suggested commits: schema/RLS, pure diagnostic engine, UI/API integration.
- Suggested final message: `feat(pronunciation): prescribe practice from oral diagnostic`.
- Stage exact paths only; do not push without instruction.

## Steps

### Step 1: Define the versioned result schema

Create Zod/types for capability snapshot, self-report, target observations, evaluator kind/version, confidence, abstention reason and five-session prescription. Separate `not_measured` from `failed` and `low_score`.

**Verify**: schema tests accept a mixed measured/not-measured result and reject missing evaluator version, unknown target ids and score claims for unsupported capabilities.

### Step 2: Add privacy/capability preflight

Before recording, explain what is sent, what is retained and that raw audio is not saved by default. Detect mic permission/API/evaluator availability. Allow the learner to continue with perception/self-report when production cannot be evaluated, without pretending completion equals evidence.

**Verify**: component tests cover supported, permission denied, unsupported browser, offline and evaluator unavailable paths; all remain navigable.

### Step 3: Build deterministic prompt selection

Select a compact balanced set from registry 066, weighted by Spanish-speaker confusables, CEFR/profile context and existing evidence, while keeping stable seeded selection for tests. Include at least one phrase transfer prompt; never ask all dimensions on every run.

**Verify**: pure tests prove bounded duration/item counts, target coverage, no duplicate prompt and deterministic seed behavior.

### Step 4: Score only supported signals

Persist perception results normally. Convert production into `SpokenAttempt` using `stt_intelligibility` or the validated acoustic evaluator. Require confidence/abstention; do not infer prosody from text alignment.

**Verify**: a transcript-perfect but acoustically-unmeasured stress prompt yields `not_measured`, not strength/mastery; segmental STT result retains its exact evaluator kind.

### Step 5: Derive priorities and first-week prescription

Rank targets using evidence confidence, user goals, error severity and transfer value. Cap at three priorities. Generate five sessions following model → perception → controlled production → varied phrase → mission transfer, and reference canonical target ids/daily reasons.

**Verify**: tests prove known strong targets are not over-prioritized, low-confidence results request more evidence, and each prescription has five bounded sessions with at least one transfer task.

### Step 6: Persist user-scoped results offline-first

Add `pronunciation_assessments` with user-scoped RLS, schema version, result JSON and timestamps. Mirror/outbox it by user. **Inherit the per-user isolation established by plan 060** — do not reinvent it: the local mirror row must carry `userId` in a user-leading compound key, and account switching must invalidate its live queries before rendering another account (per plan 060 target contract). Reuse guest-result transfer semantics: delete the guest snapshot only after authenticated persistence succeeds.

**Verify**: `pnpm test:rls:integration` against local Supabase covers own-row CRUD and cross-user denial; `pnpm exec vitest run lib/pronunciation/assessment/__tests__/persistence.test.ts` covers offline completion, reconnect, retry, guest transfer idempotency, and a two-account (A→sign out→B) test proving no diagnostic result crosses accounts.

### Step 7: Build the route and result experience

Use progressive disclosure and Spanish chrome. Results lead with “qué trabajar primero” and five-day plan, then evidence detail. Provide direct CTAs to the exact pronunciation route/target; do not lead with a large aggregate score. **Gate all user-visible result copy behind a feature flag** (e.g. `pronunciationDiagnosticCopy`) so any claim about the learner's pronunciation can be withdrawn without a data migration if the plan-071 decision forces retiring acoustic-adjacent claims. The persisted result JSON keeps its neutral `not_measured`/evaluator-version fields regardless of the flag; only presentation strings are flagged.

**Verify**: component/a11y tests cover keyboard, focus, progress announcements, retry and result navigation; a test asserts that with the copy flag off, no target renders a level/accuracy phrasing; token lint passes.

### Step 8: Integrate onboarding without conflating assessments

Home/Courses should show CEFR placement and oral diagnostic as distinct optional actions. Existing `hasPlacement` remains CEFR-specific; add a separate `hasPronunciationDiagnostic` signal. Reruns create a new versioned assessment and compare target evidence without overwriting history.

**Verify**: state tests cover neither, CEFR-only, pronunciation-only and both-complete states; no default CEFR is treated as oral diagnostic completion.

## Test plan

- Model schema/API tests after current assessment route tests and guest-transfer tests.
- Add pure selection/prescription fixtures for empty profile, weak contrast, high confidence and evaluator abstention.
- Use fake media APIs and `fake-indexeddb/auto`; no unit test should call real microphone/network.
- Run a manual light/dark/custom-hue check plus supported/unsupported browser flow.
- Verification: all commands in “Commands you will need” pass.

## Done criteria

- [ ] Oral diagnostic is separate from CEFR placement.
- [ ] Every measured result names target, signal, confidence and evaluator version.
- [ ] Unsupported dimensions are `not_measured`, never fake scores.
- [ ] Result produces at most three priorities and five actionable sessions.
- [ ] Guest/auth/offline persistence is user-scoped and idempotent.
- [ ] No raw audio is persisted by default.
- [ ] Focused tests, RLS, typecheck and token lint pass.
- [ ] `plans/README.md` row is updated.

## STOP conditions

- Plan 063 has not landed an equivalent `SpokenAttempt` contract.
- Registry 066 cannot resolve a prompt target.
- Product requires stress/rhythm/intonation scores before the plan-071 benchmark validation.
- Local Supabase cannot rebuild; do not use production as the test environment.
- The flow needs raw-audio storage; stop for explicit consent, retention and deletion design.
- Any result copy would make a phoneme-level accuracy claim (e.g. “tu /θ/ es correcta al 80%”) or an acoustic stress/rhythm/intonation claim before the plan-071 benchmark decision; keep such dimensions as `not_measured` + self-observation and stop rather than phrasing STT output as phoneme accuracy.

## Maintenance notes

Keep assessment versions immutable. New evaluators or target families create new schema/evaluator versions; they do not reinterpret historical results. Reviewers should scrutinize abstention and prescription quality more than aggregate score presentation.
