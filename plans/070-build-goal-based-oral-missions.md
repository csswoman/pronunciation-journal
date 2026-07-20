# Plan 070: Convertir roleplay y chat en misiones orales con objetivo verificable

> **Executor instructions**: Construye misiones con estado y criterios deterministas alrededor del modelo conversacional. El LLM interpreta un rol; no decide por sí solo qué evidencia cuenta ni cuándo se dominó un target. Actualiza la fila 070 al terminar.
>
> **Drift check (run first)**: `git diff --stat 99c871cb..HEAD -- lib/ai-practice components/ai-coach components/interview hooks/useAIPractice.ts hooks/useStreamingChat.ts lib/courses/curriculum.ts components/courses/CoursePathRealLife* lib/progress lib/practice docs/architecture`

## Status

- **Priority**: P1 product/pedagogy
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: plans/063-build-pronunciation-production-spine.md, plans/066-create-pronunciation-target-registry.md, plans/068-build-pronunciation-learning-route.md, plans/069-unify-actionable-pronunciation-feedback.md
- **Category**: direction
- **Planned at**: commit `99c871cb`, 2026-07-20

## Why this matters

La app ya tiene ocho prompts de roleplay, una entrevista grabada y escenarios `realLife` por CEFR, pero son catálogos separados. El chat puede conversar o mostrar widgets, aunque no existe un objetivo comunicativo, target oral, criterio de éxito ni transferencia a repaso compartidos. Las misiones convierten el Coach en el capstone contextual de la Ruta: decir algo útil, recibir una corrección y comprobarlo en una variante.

## Current state

- `lib/ai-practice/modes/roleplay.ts:4` declara ocho escenarios hardcoded y prompts independientes.
- `lib/ai-practice/tools/registry.ts:54` repite el enum de `StartRoleplayArgs`; agregar un escenario exige editar varios sitios.
- `lib/courses/curriculum.ts:46,135,227,316,427` ya contiene escenarios reales y frases por nivel, pero no se conectan con roleplay/progreso.
- `components/ai-coach/ChatTabs.tsx:8` llama “Interview” a una superficie descrita como “Practice real scenarios”; no existe una biblioteca de misiones.
- `hooks/useStreamingChat.ts:69-225` persiste conversación libre; `:225-253` solo crea evidencia cuando se responde un widget.
- `lib/ai-practice/coach-progress.ts:57-74` registra una sesión coherente de widgets y ofrece el patrón de persistencia.
- InterviewResults ya guarda turnos pronunciados como actividad, pero no mide éxito comunicativo ni target de misión.

## Mission contract

Crear un `OralMission` registry con:

- id estable, CEFR recomendado, contexto y objetivo comunicativo;
- roles, apertura y máximo de turnos;
- 2–3 target phrases y target ids de pronunciación;
- criterios deterministas: required intents/information, comprensión/repair y producción evaluada cuando disponible;
- variantes para transferencia y políticas de ayuda/corrección;
- resultado por dimensiones: `goalAchieved`, `intelligibilityEvidence`, `targetEvidence`, `repairUsed`, `unscoredReasons`.

El texto es fallback accesible, pero no genera speaking/pronunciation evidence.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Mission engine | `pnpm exec vitest run lib/ai-practice/missions lib/ai-practice/__tests__/roleplay.test.ts` | all selected tests pass |
| Coach/interview | `pnpm exec vitest run components/ai-coach components/interview hooks/__tests__` | all selected tests pass |
| API prompts | `pnpm audit:ai-prompts` | exit 0 |
| Typecheck | `pnpm type-check` | exit 0 |
| Design tokens | `pnpm lint:design-tokens` | exit 0 |
| Accessibility | `pnpm test:a11y --grep "oral mission"` | targeted tests pass |

## Suggested executor toolkit

- Use `better-ui`, `web-design-guidelines` and `vercel-react-best-practices` after reading mandatory design docs.
- Keep Gemini calls behind existing prompt/client guards; do not add a direct provider call from UI.

## Scope

**In scope**:
- New mission registry/state machine/evaluator under `lib/ai-practice/missions/`.
- Adapters from current roleplay prompts, `realLife` scenarios and Interview.
- Mission browser/runner/results inside the existing AI Coach shell.
- Voice/text fallback, target feedback, route/Daily/Tracking launch metadata and canonical progress.
- Prompt validation, component/integration tests and architecture docs.

**Out of scope**:
- Real-time phone/duplex audio or animated avatars.
- Arbitrary user-generated mission definitions in v1.
- Letting model prose determine mastery without structured evidence.
- Counting a text turn as oral evidence.
- Storing raw audio by default or redesigning the full Coach panel.

## Git workflow

- Branch: `codex/070-oral-missions`.
- Suggested commits: registry/state machine, prompt/API adapter, runner/results/integrations.
- Suggested message: `feat(coach): add goal-based oral missions`.
- Stage exact paths only; do not push without instruction.

## Steps

### Step 1: Consolidate scenarios into a mission registry

Create one typed registry and migrate the current roleplay enum plus CEFR real-life scenarios into it. Keep compatibility adapters for existing mode strings (`roleplay:<scenario>`). Each mission must reference canonical target ids and authored phrases; no duplicate enums.

**Verify**: registry tests assert unique ids, valid targets, CEFR/context coverage and round-trip compatibility for all eight existing scenarios.

### Step 2: Define a deterministic mission state machine

Model `briefing → active → correction/retry → transfer → result`, with bounded turns, resume, cancel and provider-failure states. Track required communicative intents separately from model messages. The model can emit structured events; the reducer owns state transitions.

**Verify**: reducer tests cover success, missing intent, early cancel, quota failure, reload/resume, text fallback and duplicate structured event idempotency.

### Step 3: Build guarded prompts and structured mission events

Generate the role prompt from registry data plus compact learner/target state. Require one question at a time, natural role behavior and at most one prioritized correction. Extend validated tools/events for intent observed, clarification/repair and mission end; reject unknown mission ids/events.

**Verify**: `pnpm audit:ai-prompts` passes; route/parser tests reject malformed/unknown events and public errors remain provider-neutral.

### Step 4: Make voice the primary path with honest fallback

Reuse the mic/SpokenAttempt flow from plan 063. Show recording/processing/error states, allow replay and text fallback. Attach voice metadata to turns; only scored oral attempts contribute speaking/pronunciation. Permission/evaluator failure must not block goal practice.

**Verify**: integration tests cover spoken turn, text turn, permission denial, evaluator unavailable and reconnect without duplicated conversation turns.

### Step 5: Apply shared feedback and a varied transfer

After a meaningful turn, use plan 069 to select one correction. Allow one guided retry, then test the target in a changed phrase/situation. Avoid interrupting every turn; preserve natural conversation unless correction is high-impact or mission-targeted.

**Verify**: tests show one correction maximum, retry, different transfer phrase and no false improvement when either attempt is unscored.

### Step 6: Evaluate mission outcome by dimensions

Derive goal achievement from required structured intents/information, not sentiment in model text. Record oral/intelligibility/target evidence separately with confidence and evaluator version. A mission can achieve its communicative goal while pronunciation still needs review.

**Verify**: fixtures cover goal achieved + weak pronunciation, goal missed + intelligible speech, clarification success and fully unscored fallback.

### Step 7: Persist one coherent mission session

Persist conversation locally/user-scoped, scored attempts individually and one activity session with mission id, target ids and outcome summary. Do not duplicate widget/turn evidence. Enqueue weak targets through existing review; keep mission completion distinct from target mastery.

**Verify**: Dexie/outbox tests cover offline complete, reconnect, retry/idempotency, two users and exact session/answer counts.

### Step 8: Build mission discovery and results in Coach

Replace the ambiguous “Interview” entry with a mission library while retaining interview as a mission category. Show goal, estimated time, target phrases and why recommended. Results lead with goal achieved/next action, one feedback target and review CTA—not a large opaque score.

**Verify**: component tests cover empty/recommended/category/active/result/resume states; token lint and targeted a11y pass.

### Step 9: Connect Route, Daily and Tracking

Allow launches with `missionId`, `targetIds` and source metadata from pronunciation-route transfer steps, Daily and tracked phrases. On completion, reconcile only the exact source step. A saved phrase may seed target material but cannot mutate the authored mission contract silently.

**Verify**: end-to-end contract tests assert exact mission launch, exact Daily reconciliation and filter-faithful tracked phrase transfer.

## Test plan

- Use pure reducer tests for all mission transitions; mock Gemini only at the structured-event boundary.
- Add prompt/parser tests for injection-resistant authored contract handling, malformed tools and provider degradation.
- Add component tests with fake mic/STT and `fake-indexeddb/auto` for resume/offline/two-user behavior.
- Add one contract test per launch source: Route, Daily, Tracking and direct Coach.
- Manual validation: mobile/desktop, light/dark/custom hue, keyboard, touch, permission denied and quota exhaustion.
- Verification: all commands in “Commands you will need” pass.

## Done criteria

- [ ] One registry owns all existing and new scenarios.
- [ ] Mission state/progress is deterministic and resumable.
- [ ] Voice turns and text fallback remain semantically distinct.
- [ ] Goal achievement, pronunciation evidence and mastery are separate.
- [ ] One prioritized correction leads to a varied transfer attempt.
- [ ] Route, Daily and Tracking launch/reconcile exact mission ids.
- [ ] Offline/idempotent/two-user tests pass without raw-audio storage.
- [ ] Prompt audit, focused tests, a11y, typecheck and token lint pass.

## STOP conditions

- Plans 063/066/069 are absent and no equivalent target/attempt/feedback contracts exist.
- Mission completion would rely only on free-form model judgment.
- A text fallback is being counted as speaking.
- The model must receive private data beyond compact learning/mission context; stop and minimize it.
- Raw-audio retention or real-time duplex infrastructure becomes required; split into a separately approved plan.

## Maintenance notes

Mission content is authored product data; LLM prompts render that contract rather than define it. New missions must pass registry coverage, structured-outcome and target-reference tests before appearing in the UI.
