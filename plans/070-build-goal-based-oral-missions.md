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

**Señal consumida**: `targetEvidence`/`intelligibilityEvidence` de un turno hablado se scorea solo con `stt_intelligibility` (reconocimiento de palabras vía STT) vía el `SpokenAttempt` del plan 063. `goalAchieved` se deriva de intents/información estructurada (reducer determinista), no del texto del modelo ni de un score fonémico. No hay evaluación acústica de stress/ritmo/intonation hasta la decisión del plan-071 benchmark.

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

Persist conversation locally/user-scoped, scored attempts individually and one activity session with mission id, target ids and outcome summary. The local mission session inherits the per-user isolation from plan 060 (user-leading key, account-switch invalidation) — do not write a device-global mission row. Do not duplicate widget/turn evidence. Enqueue weak targets through existing review; keep mission completion distinct from target mastery.

**Verify**: `pnpm exec vitest run lib/ai-practice/missions` — Dexie/outbox tests cover offline complete, reconnect, retry/idempotency, exact session/answer counts, and a two-account (A→sign out→B) case proving B never sees A's mission conversation or evidence.

### Step 8: Build mission discovery and results in Coach

Replace the ambiguous “Interview” entry with a mission library while retaining interview as a mission category. Show goal, estimated time, target phrases and why recommended. Results lead with goal achieved/next action, one feedback target and review CTA—not a large opaque score. **Gate any results copy that states a pronunciation outcome behind a feature flag** so it can be withdrawn without a data migration if the plan-071 decision retires acoustic-adjacent claims; `goalAchieved`/structured-outcome fields stay unflagged. Frame target evidence as intelligibility/contrast, never as a “native” accent or phoneme accuracy.

**Verify**: component tests cover empty/recommended/category/active/result/resume states; a test asserts that with the copy flag off no result renders a pronunciation-accuracy claim; token lint and targeted a11y pass.

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

- [x] One registry owns all existing and new scenarios.
- [x] Mission state/progress is deterministic and resumable.
- [x] Voice turns and text fallback remain semantically distinct.
- [x] Goal achievement, pronunciation evidence and mastery are separate.
- [x] One prioritized correction leads to a varied transfer attempt.
- [x] Route, Daily and Tracking launch/reconcile exact mission ids.
- [x] Offline/idempotent/two-user tests pass without raw-audio storage.
- [ ] Prompt audit, focused tests, a11y, typecheck and token lint pass.

## Verification (2026-07-27)

- Registry, prompt/event contracts, deterministic reducer/outcome, persistence and mission library/runner are covered by the focused mission tests. Correction now follows `correction → active → scored same-target retry → transfer`; unscored retries and unrelated targets do not advance.
- The live stream preserves its `abortRef`/`streamIdRef` race guards. Its `mission_intent_observed` callback is now routed to `MissionWorkspace`, where the UI-owned reducer records validated intents; the hook itself remains transport-only. Mission summaries remain visible with actionable feedback copy disabled.
- `MissionWorkspace` now uses the Coach TTS path for normal/slow correction playback. The transfer prompt has a real record/stop-and-submit control: its STT transcript becomes an honest `unscored` `SpokenAttempt` and dispatches `transfer_attempted` only while the reducer is in `transfer`. Tests cover runner callback plumbing and both TTS rates.
- Selecting a mission keeps the conversation surface mounted under the runner. Typed turns dispatch `turn_text`; microphone transcripts are scored against the active target before dispatching `turn_spoken`, so text cannot create correction evidence. Completed sessions now derive/render `MissionResult` and persist the mission outcome before offering the existing review route.
- A streamed `start_mission` tool call now switches `useAIPractice` to `mission:${missionId}` and the Coach panel to the Missions tab; the following request therefore retains the authored mission prompt instead of silently continuing as free chat.
- When that tool starts from an existing chat stream, the same user-owned conversation is relabelled to the mission mode after its id is available. This preserves the active stream and messages while ensuring history resumes with the authored prompt.
- Route/Daily/Tracking search found no current `roleplay:` launch call sites in `components/courses/`, `lib/practice/daily-plan/`, or `components/tracking/`; `parseMissionLaunch` now defines and tests their exact launch contracts instead of fabricating integrations.
- Passed: `pnpm exec vitest run lib/ai-practice/missions lib/ai-practice/__tests__/stream-processor.test.ts`, focused Coach/Interview/hooks tests, `pnpm audit:ai-prompts`, `pnpm type-check`, `pnpm lint:design-tokens`, and the full Vitest suite. The mission runner additionally tests keyboard activation of the retry control.
- Remaining verification gap: `pnpm test:a11y --grep "oral mission"` reports no matching Playwright tests because there is no auth-independent live mission route. The component-level keyboard test is green, but the final a11y criterion remains unchecked until a browser-accessible mission fixture or authenticated e2e setup is added.

## STOP conditions

- Plans 063/066/069 are absent and no equivalent target/attempt/feedback contracts exist.
- Mission completion would rely only on free-form model judgment.
- A text fallback is being counted as speaking.
- The model must receive private data beyond compact learning/mission context; stop and minimize it.
- Raw-audio retention or real-time duplex infrastructure becomes required; split into a separately approved plan.
- Mission results would present a phoneme-level accuracy or acoustic stress/rhythm/intonation score, or frame the goal as a single “native” accent, before the plan-071 benchmark decision; keep `targetEvidence` as `stt_intelligibility` and frame goals as intelligibility/contrast.

## Maintenance notes

Mission content is authored product data; LLM prompts render that contract rather than define it. New missions must pass registry coverage, structured-outcome and target-reference tests before appearing in the UI.
