# Plan 069: Unificar feedback de pronunciación en una corrección accionable

> **Executor instructions**: Reemplaza scores genéricos y listas de errores por un contrato único de feedback que prioriza un target, explica la señal medida y conduce a reintento/transferencia. No conviertas STT en análisis acústico. Actualiza la fila 069 al terminar.
>
> **Drift check (run first)**: `git diff --stat 99c871cb..HEAD -- lib/pronunciation components/lesson components/ai-coach/PronunciationView.tsx components/ai-coach/pronunciation components/interview components/exercises lib/ai-practice/coach-progress.ts docs/architecture`

## Status

- **Priority**: P1 pedagogy/product
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/063-build-pronunciation-production-spine.md, plans/066-create-pronunciation-target-registry.md
- **Category**: direction, tech-debt
- **Planned at**: commit `99c871cb`, 2026-07-20

## Why this matters

La app presenta feedback distinto según la superficie: un porcentaje/XP, una tabla de fonemas, chips al hover o un score de entrevista llamado “pronunciation accuracy”. El usuario necesita saber qué se entendió, qué único patrón trabajar, cómo cambiarlo y si mejoró en una frase nueva. Un modelo compartido evita contradicciones y permite que Sound Lab, Coach, Interview y futuras misiones creen la misma remediación.

## Current state

- `components/lesson/PronunciationFeedback.tsx:11-128` recibe `accuracy`, color, emoji y `xpEarned`; el porcentaje grande precede la acción pedagógica.
- Sus chips reproducen audio principalmente con `onMouseEnter`/`title`, interacción débil en touch y para lectores de pantalla.
- `components/lesson/PhonemeFeedbackTable.tsx` muestra articulación por fonema y click de audio, pero no selecciona prioridad ni conduce a una frase de transferencia.
- `components/ai-coach/PronunciationView.tsx:29,228` usa `firstBadPhoneme`, pero `:151` alinea palabras por índice en lugar del DP compartido de `scoring.ts`.
- `components/interview/InterviewResults.tsx:170` etiqueta el promedio como “Overall pronunciation accuracy”, aunque `lib/pronunciation/scoring.ts:15` documenta comparación de transcript/target.
- El plan-071 benchmark puede añadir un evaluator acústico, pero este feedback debe funcionar también si la decisión es no-ship (el plan 064 validó la dirección; no habilitó evaluador de producción).
- **Señal consumida**: hoy el feedback consume `stt_intelligibility` (reconocimiento de palabras vía STT) y `transcript_phoneme_inference` (proyección de fonemas desde el diccionario sobre el transcript — NO medición acústica). Ninguna dimensión acústica de stress/ritmo/intonation está disponible hasta la decisión del plan-071 benchmark; el resumen "qué se entendió" nunca debe presentarse como score de precisión fonémica.

## Feedback contract

Crear `PronunciationFeedbackModel` versionado con:

- `signalKind`, evaluator version, confidence y abstention reason;
- resumen “qué se entendió” sin score engañoso;
- `priorityTargetId` canónico y evidencia que lo justifica;
- contraste esperado/observado solo cuando la señal lo soporta;
- una explicación breve de articulación/prosodia;
- modelo normal/lento, grabación/replay local, reintento y frase variada;
- outcome `improved|same|needs_more_evidence|unscored` y review recommendation.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Feedback model | `pnpm exec vitest run lib/pronunciation/feedback` | all selected tests pass |
| Surface adapters | `pnpm exec vitest run components/lesson components/ai-coach components/interview components/exercises` | all selected tests pass |
| Typecheck | `pnpm type-check` | exit 0 |
| Design tokens | `pnpm lint:design-tokens` | exit 0 |
| Accessibility | `pnpm test:a11y --grep "pronunciation feedback"` | targeted tests pass |

## Suggested executor toolkit

- Use `better-ui` and `web-design-guidelines`; read the four mandatory design documents before UI edits.
- If the plan-071 benchmark ships an evaluator, consume it through the provider-neutral interface (the `AcousticEvaluator` contract landed unwired by plan 064); do not import a vendor directly into components.

## Scope

**In scope**:
- New pure model/prioritizer/adapters under `lib/pronunciation/feedback/`.
- Shared feedback/remediation components under `components/pronunciation-feedback/`.
- Migration of current lesson, coach and interview feedback surfaces.
- Shared sequence alignment, audio/replay accessibility, review handoff and tests/docs.

**Out of scope**:
- Implementing an acoustic evaluator.
- Persisting raw audio or autoplaying recordings.
- Redesigning the whole Interview/Coach shell.
- Correcting every detected error in one attempt.
- A prominent global pronunciation score or XP redesign outside these surfaces.

## Git workflow

- Branch: `codex/069-actionable-pronunciation-feedback`.
- Suggested commits: pure feedback model, shared UI, surface adapters/tests.
- Suggested message: `refactor(pronunciation): unify actionable feedback and retry`.
- Stage exact paths only; do not push without instruction.

## Steps

### Step 1: Define signal-safe feedback types

Create discriminated types for `stt_intelligibility`, `transcript_phoneme_inference`, optional acoustic dimensions and `unscored`. Encode which fields each signal may populate so STT cannot type-check with claims about stress/intonation acoustics.

**Verify**: type/unit tests reject unsupported observed-vs-expected claims and require evaluator version/confidence for scored feedback.

### Step 2: Reuse robust word/phoneme alignment

Expose the DP alignment from `lib/pronunciation/scoring.ts` as the shared path. Remove index-based phrase alignment from PronunciationView. Preserve strict minimal-pair mode and evaluator versioning.

**Verify**: tests cover omitted, extra and substituted middle words without shifting every later word; existing strict/fuzzy scoring tests remain green.

### Step 3: Prioritize one actionable target

Rank errors by canonical target, confidence, communicative impact, recurrence and lesson/mission goal. Select one primary correction; keep other observations collapsed as secondary evidence. If confidence is insufficient, ask for another attempt instead of correcting.

**Verify**: fixtures with multiple errors choose the intended lesson target, recurring high-impact target or `needs_more_evidence`; ordering is deterministic.

### Step 4: Build the remediation sequence

Implement a reusable sequence: listen normal/slow → concise placement/motion cue → optional contrast example → record/replay → retry same phrase once → varied phrase. Mark improvement only by comparable evaluator kinds/versions.

**Verify**: component/state tests cover scored improvement, same result, evaluator change, unscored fallback, skip and varied transfer.

### Step 5: Make audio/feedback accessible on touch and keyboard

Replace hover-only playback with real buttons of at least 44px targets, focus-visible states and explicit labels. Use `font-ipa` for IPA, `aria-live` for result changes and never autoplay user recordings.

**Verify**: targeted a11y tests find no serious violations; keyboard can listen, record, replay, retry and continue; touch path has no hover dependency.

### Step 6: Adapt every current surface

Create thin adapters for `PronunciationFeedback`, `PhonemeFeedbackTable`, PronunciationView and InterviewResults. Replace “Overall pronunciation accuracy” with signal-honest copy. **Gate the new signal-honest copy behind a feature flag** so the label change can be reverted without a data migration if the plan-071 decision changes what may be claimed; the underlying `signalKind`/evaluator-version fields stay unflagged. Surface-specific shells may differ, but prioritization/remediation logic must not.

**Verify**: `pnpm exec vitest run components/lesson components/ai-coach components/interview components/exercises` — snapshot/behavior tests assert the same attempt produces the same priority target and label across all adapters, and that with the copy flag off no surface renders a phoneme-accuracy or acoustic-dimension claim.

### Step 7: Persist remediation evidence and review handoff

Attach priority target, attempt pair and transfer outcome to canonical evidence without raw audio. This evidence inherits the per-user isolation from plan 060 (user-leading key, account-switch invalidation); do not write a device-global feedback row. If improved/needs-review, enqueue the target through the existing scheduler/review contract; do not create a feedback-specific SRS.

**Verify**: `pnpm exec vitest run lib/pronunciation/feedback` — persistence tests show one logical attempt pair, no duplicate session, exact target id, correct `unscored` exclusion, and a two-account assertion that feedback evidence never crosses accounts.

### Step 8: Document evaluator honesty and correction policy

Update architecture/pedagogy docs with signal labels, one-correction policy, abstention, comparable-version rule and privacy behavior.

**Verify**: `git grep -n "Overall pronunciation accuracy" components` → no matches; docs distinguish intelligibility, inferred phonemes and acoustic dimensions.

## Test plan

- Model pure prioritizer tests after existing pronunciation scoring tests.
- Add contract tests for each signal kind, multiple errors, low confidence, evaluator version change and unscored fallback.
- Add component tests for touch/keyboard/audio/retry and cross-surface parity.
- Manual check: light/dark/custom hue, mobile/desktop, permission denied and network failure.
- Verification: all commands in “Commands you will need” pass.

## Done criteria

- [ ] Every pronunciation surface consumes one shared feedback model.
- [ ] Feedback labels the actual signal and evaluator version.
- [ ] One primary target leads to listen, explanation, retry and varied phrase.
- [ ] Omitted/extra words do not shift later alignment.
- [ ] Hover is not required for audio or explanations.
- [ ] Unscored attempts never count as improvement/mastery.
- [ ] Review handoff uses canonical target/SRS contracts.
- [ ] Focused tests, a11y, typecheck and token lint pass.

## STOP conditions

- Registry 066 cannot map an observation to a target.
- A surface needs a claim unsupported by its evaluator kind.
- Retry comparison crosses incompatible evaluator versions; show both attempts without an improvement claim.
- Raw-audio persistence becomes necessary; stop for consent/retention design.
- Shared feedback would require changing unrelated shell navigation/layout; keep a thin adapter instead.
- Any surface would present `stt_intelligibility` or `transcript_phoneme_inference` as phoneme-level accuracy or an acoustic stress/rhythm/intonation score before the plan-071 benchmark decision; label the actual signal and abstain instead.

## Maintenance notes

Add new evaluators by writing one adapter into `PronunciationFeedbackModel`; components must remain provider-neutral. Reviewers should prioritize confidence/abstention and next action over visual score polish.
