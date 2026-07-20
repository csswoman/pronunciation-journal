# Plan 063: Conectar teoría, sonidos, frases y chat en un circuito oral medible

> **Executor instructions**: Implementa el circuito en incrementos verificables. La señal actual basada en transcript se llama inteligibilidad, no precisión acústica. No promociones mastery con intentos no evaluados. Actualiza la fila 063 al terminar.
>
> **Drift check (run first)**: `git diff --stat c779781b..HEAD -- lib/phoneme-practice components/exercises components/ai-coach hooks/useStreamingChat.ts hooks/useAIPractice.ts lib/exercises/generators/connected-speech.ts lib/progress lib/practice/daily-plan components/daily docs/architecture/exercises.md`

## Status

- **Priority**: P1 product/pedagogy
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: 059, 060, 062
- **Category**: direction, bug
- **Planned at**: commit `c779781b`, 2026-07-19

## Why this matters

La app ya tiene teoría, discriminación auditiva, dictado, speaking de palabras y un coach de frases, pero están en carriles distintos. Sound Lab puede declarar dominio sin producción; el coach oral guarda estado solo local; connected speech no pide hablar; el micrófono del chat no hace nada. El producto diferencial no debe ser una copia de Elsa: debe cerrar el loop “entender → notar → oír → producir → usar en contexto → repasar”.

## Current state

- `lib/phoneme-practice/exercises.ts:189-211` implementa `generateSpeakWord` y el renderer existe, pero `mixed-session.ts:112-175` nunca programa `speak_word`.
- `components/exercises/SpeakScoredExercise.tsx:123-128` llama `onSubmit(true, '')` si falla la evaluación; navegadores no soportados quedan bloqueados en `130-137`.
- `components/ai-coach/PronunciationView.tsx:144-200` analiza y guarda queue/seen/mastery local, pero no `savePracticeAnswer`, `recordActivitySession` ni progreso de contrastes.
- `components/ai-coach/CustomPromptPanel.tsx:129-135` muestra “Voice input” sin `onClick`.
- `lib/exercises/generators/connected-speech.ts:66-147` genera quiz/dictado, no producción.
- `lib/progress/daily-reconcile.ts:79` resuelve el primer `concept` ante cualquier sesión `courses` y no resuelve `study_deck`, aunque metadata ya admite `lessonSlug`.
- `hooks/useAIPractice.ts:82-90` difiere cinco segundos el learning state y el cleanup cancela sin guardar el último snapshot.

## Target learning loop

1. Teoría breve con un único objetivo observable.
2. Noticing/modelo de audio.
3. Discriminación auditiva.
4. Producción controlada de palabra.
5. Producción de frase corta/connected speech.
6. Transferencia en chat o interview oral.
7. Revisión espaciada del target débil con nueva frase.

Cada paso emite evidencia separada y solo los pasos evaluados actualizan mastery/SRS.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Oral components | `pnpm exec vitest run components/exercises components/ai-coach hooks/__tests__ lib/pronunciation` | selected tests pass |
| Sounds/progress | `pnpm exec vitest run lib/phoneme-practice lib/progress lib/practice app` | selected tests pass |
| Typecheck | `pnpm type-check` | exit 0 |
| Accessibility/manual | Chromium + one alternate browser | permission, unsupported and network-failure paths remain completable without false success |

## Scope

**In scope**: `speak_word` scheduling, unscored result state, shared spoken-attempt adapter, PronunciationView persistence, voice input in chat, connected-speech production, exact Daily reconciliation, AI learning-state flush, focused tests and current architecture docs.

**Out of scope**: acoustic evaluator implementation (plan 064); storing raw audio by default; real-time phone-call UX; visual redesign; changing SRS math; rewarding plain text chat as speaking.

## Git workflow

- Branch: `codex/063-pronunciation-spine`.
- Suggested commits by vertical slice: result contract/fallback, Sound Lab, coach/chat, Daily/docs.
- Scoped staging only; do not push without instruction.

## Steps

### Step 1: Add an honest spoken-attempt contract

Define `SpokenAttempt` with user, target text, transcript, evaluator version, score kind (`stt_intelligibility` initially), overall score, target/contrast ids, duration and outcome `scored|unscored|skipped|failed`. Only `scored` attempts may affect accuracy/SRS. Do not persist audio unless a separate consent/retention feature is designed.

**Verify**: unit tests prove unscored/skipped attempts contribute neither 100% nor 0% accuracy and never promote mastery.

### Step 2: Fix fallback and unsupported-browser behavior

Replace `onSubmit(true, '')` with an explicit unscored shadowing result. Offer listen/repeat/continue for both evaluation failures and unsupported APIs; explain that the attempt was not scored.

**Verify**: update `SpeakScoredExercise.test.tsx`; network failure and unsupported browser can finish, with no correct answer/SRS event.

### Step 3: Schedule production in Sound Lab

After modeling and discrimination, include at least one word production and one short phrase production for a selected contrast when mic/evaluation is available. Use the target attribution from plan 062. Adapt quantity by level and prior evidence; do not put production first for a new contrast.

**Verify**: builder tests assert A1 and advanced sessions contain the intended order and target metadata; unscored paths leave contrast mastery unchanged.

### Step 4: Persist Pronunciation Coach attempts through the canonical pipeline

Replace queue-only mastery with user-scoped spoken attempts, real answer/activity session records and contrast/phrase review projection. Reuse shared sequence alignment from `lib/pronunciation/scoring.ts` instead of index-aligning words, so one omitted word does not shift all later feedback.

**Verify**: record → transcribe → score → persist → reload → recommend tests pass for correct, omitted-word, unscored and two-user cases.

### Step 5: Turn connected-speech theory into production

For stress, rhythm, reductions/linking and intonation lessons, add an exercise sequence that models audio, asks the learner to shadow a phrase and then varies the phrase. Completion remains separate from the evaluated production result per plan 059.

**Verify**: generator tests for each target include a productive step and retain offline fallback without fabricating a score.

### Step 6: Wire oral chat as contextual transfer

Connect `CustomPromptPanel` to the shared microphone/speech-input lifecycle with recording, processing, permission and error states. A spoken turn sends its transcript as conversation content plus voice metadata; only a scored spoken attempt earns speaking/pronunciation evidence. The coach returns at most one prioritized pronunciation correction and an optional retry phrase.

**Verify**: component/integration tests cover mic click, transcript send, permission denial, retry, textual turn (no speaking tag) and oral turn (speaking tag).

### Step 7: Flush adaptive state and reconcile the exact assignment

Persist the latest AI learning-state snapshot on explicit close, unmount and `pagehide` with deduplication. Carry exact daily step identity (`concept:<slug>` or `study_deck:<level>:<lesson>`) through completion/session metadata and mark only the matching step done.

**Verify**: tests with simultaneous concept/study-deck steps resolve the exact one; close within five seconds retains weak topics and spoken targets.

### Step 8: Update architecture documentation

Update `docs/architecture/exercises.md` and `docs/architecture/offline-sync.md` with a surface→evidence→store/SRS→progress-consumer matrix. Replace retired `user_sound_progress`/legacy local stores with `user_contrast_progress`. Document STT intelligibility, transcript-derived phoneme match and future acoustic analysis as three distinct signal levels.

**Verify**: `git grep -n "user_sound_progress\|localSoundProgress\|localAnswerHistory" docs/architecture` → no active-current claims; historical notes must be labeled legacy.

## Test plan

- Characterize the full path model → discriminate → record → transcribe → score/unscored → persist → Daily/review.
- Cover supported, permission-denied, unsupported, network-failed and immediate-close paths.
- Use `fake-indexeddb/auto` for coach persistence and two-user isolation.
- Add a matrix test mapping each oral surface to expected answer/session/SRS/completion outputs.
- Verification: both focused Vitest commands, typecheck and the manual two-browser checklist pass.

## Done criteria

- [ ] Sound Lab requires/elects real production before mastery when supported.
- [ ] Unscored shadowing never counts as correct or mastery.
- [ ] Pronunciation Coach attempts appear in progress and review, scoped by user.
- [ ] Connected-speech lessons reach phrase production.
- [ ] Chat mic works; plain text does not count as speaking.
- [ ] Daily reconciles only the exact assigned theory step.
- [ ] Latest AI adaptive state survives immediate close.
- [ ] Focused tests, typecheck and docs checks pass.

## STOP conditions

- A target cannot be mapped to a canonical phrase/contrast id.
- The implementation needs to label transcript matching as acoustic accuracy.
- Browser capability would make a required course impossible to complete; retain an unscored accessible path.
- Raw audio storage becomes necessary; stop for privacy/retention/consent design.
- Plan 059/060/062 contracts are not landed or equivalent behavior is absent.

## Maintenance notes

The oral loop should correct one actionable target at a time. Reviewers should reject “speaking” telemetry derived only from route/context and any mastery state that cannot point back to scored attempts.
