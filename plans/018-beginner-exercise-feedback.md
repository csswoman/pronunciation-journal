# Plan 018: Unificar feedback pedagogico para ejercicios y hacerlo util para principiantes

> **Executor instructions**: Sigue este plan paso a paso. Ejecuta cada comando
> de verificacion y confirma el resultado esperado antes de avanzar. Si ocurre
> algo listado en "STOP conditions", detente y reporta; no improvises.
>
> **Drift check (run first)**:
> `git diff --stat dc95681..HEAD -- components/exercises components/practice/session lib/practice lib/exercises docs/architecture/exercises.md`
>
> Si algun archivo in-scope cambio desde que se escribio este plan, compara los
> excerpts de "Current state" con el codigo vivo antes de proceder. Si no
> coinciden semanticamente, tratalo como STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `dc95681`, 2026-06-21

## Why this matters

La app ya tiene un motor solido de practica, SRS y progreso, pero el feedback
principal de ejercicios aun se siente binario para un alumno A1/A2: correcto,
incorrecto, continua. Eso contradice el producto descrito en `PRODUCT.md`, donde
los principiantes deben tener entrada guiada y el feedback debe sentirse
significativo. El objetivo de este plan es crear un contrato comun de feedback
pedagogico y conectarlo al flujo de practica generica, sin reescribir el motor
ni romper la arquitectura de registries.

Cuando esto aterrice, un fallo en `fill_blank`, `reorder_words`,
`sentence_dictation`, `multiple_choice` o produccion deberia explicar: que paso,
cual era la respuesta esperada, por que importa, que pista seguir y si conviene
reintentar antes de avanzar.

## Current state

- `PRODUCT.md` define el norte del producto:
  - `PRODUCT.md:16` dice que los usuarios notan cuando el feedback se siente
    significativo versus generico.
  - `PRODUCT.md:20` promete que principiantes tengan entry points guiados.
  - `PRODUCT.md:35` establece "Feedback earns its weight".
- `components/practice/session/GenericExerciseView.tsx` es el wrapper principal
  de ejercicios genericos. Hoy guarda resultado local solo con correccion,
  respuesta, tiempo y score:

```tsx
// components/practice/session/GenericExerciseView.tsx:37-48
function handleResult(
  isCorrect: boolean,
  userAnswer: string,
  timeMs: number,
  extras?: { score?: number },
) {
  if (isProduction) {
    onSubmit(isCorrect, userAnswer, extras)
    return
  }
  setResult({ isCorrect, userAnswer, timeMs, score: extras?.score })
}
```

- `components/exercises/ExerciseShell.tsx` muestra feedback comun, pero el
  contenido es generico y auto-avanza despues de 900 ms:

```tsx
// components/exercises/ExerciseShell.tsx:56-69
useEffect(() => {
  if (!done) return
  const timer = setTimeout(onContinue, 900)
  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter') { clearTimeout(timer); onContinue() }
  }
  window.addEventListener('keydown', handleKey)
  return () => { clearTimeout(timer); window.removeEventListener('keydown', handleKey) }
}, [done, onContinue])

{done && <FeedbackBanner isCorrect={result.isCorrect} />}
```

```tsx
// components/exercises/ExerciseShell.tsx:139-149
function FeedbackBanner({ isCorrect }: { isCorrect: boolean }) {
  return (
    ...
      <span>{isCorrect ? 'Well done!' : 'Not quite — keep going!'}</span>
    ...
  )
}
```

- `lib/practice/types.ts` limita el submit comun a score opcional:

```ts
// lib/practice/types.ts:184-188
export type PracticeSubmitHandler = (
  isCorrect: boolean,
  userAnswer: string,
  extras?: { score?: number },
) => void
```

- `components/practice/session/useSessionState.ts` ya tiene una fase `hints`,
  pero solo la usa para fonemas fallados. Los genericos pasan a feedback breve:

```ts
// components/practice/session/useSessionState.ts:28-30
const FEEDBACK_MS = 1500
type Phase = 'exercising' | 'feedback' | 'hints' | 'complete'
```

```ts
// components/practice/session/useSessionState.ts:166-169
if (!isCorrect && current.payload.kind === 'phoneme' && userAnswer !== 'skip') {
  setPhase('hints')
  return
}
setPhase('feedback')
```

- `lib/exercises/design.ts` y `lib/exercises/evaluator.ts` ya tienen un modelo
  pedagogico aprovechable, usado en AI Coach y speaking:

```ts
// lib/exercises/design.ts:41-53
export type EvaluationResult = {
  correct: boolean;
  category: AnswerCategory;
  userAnswer: string;
  expectedAnswer: string;
  feedback: {
    immediate: string;
    explanation: string;
    tip?: string;
    example?: string;
  };
  score?: number;
  gradedBy: "client" | "model";
};
```

```ts
// lib/exercises/evaluator.ts:56-60
export function evaluateExercise(
  userAnswer: string,
  design: ExerciseDesign,
  userLevel?: CEFRLevel
): EvaluationResult {
```

- Algunos componentes ya tienen feedback especifico, pero no esta normalizado:
  - `SentenceDictationExercise.tsx:150` muestra `FeedbackBar` con frase correcta.
  - `MultipleChoiceExercise.tsx:76` muestra `exercise.explanation` si existe.
  - `ReorderWordsExercise.tsx:112` muestra "Correct order" solo en `focusUi`.
- Convenciones relevantes:
  - No prompts inline en componentes. Prompts Gemini solo en `lib/ai-prompts.ts`.
  - Nuevos tipos de ejercicio pasan por registry, no por condicionales en
    `ExerciseRenderer`.
  - Componentes idealmente <=250 lineas; ESLint advierte a 300.
  - Tailwind tokens, sin colores hardcodeados nuevos.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0, no TypeScript errors |
| Lint | `pnpm lint` | exit 0 |
| Unit tests | `pnpm test` | all tests pass |
| Focus tests | `pnpm test -- components/exercises components/practice/session lib/exercises lib/practice` | relevant tests pass |

Do not run formatters that rewrite unrelated files. Do not run installs unless
the workspace is missing dependencies.

## Scope

**In scope**:

- `lib/practice/types.ts`
- `components/practice/session/GenericExerciseView.tsx`
- `components/practice/session/useSessionState.ts`
- `components/practice/session/SessionExercisingBody.tsx`
- `components/exercises/ExerciseShell.tsx`
- `components/exercises/FillBlankExercise.tsx`
- `components/exercises/ReorderWordsExercise.tsx`
- `components/exercises/SentenceDictationExercise.tsx`
- `components/exercises/MultipleChoiceExercise.tsx`
- `components/exercises/ProductionFeedback.tsx`
- `lib/exercises/design.ts`
- `lib/exercises/evaluator.ts`
- New helper files under `lib/exercises/` or `lib/practice/` if needed.
- Tests next to the touched modules under existing `__tests__/` directories.
- `docs/architecture/exercises.md` for documenting the new feedback contract.
- `plans/README.md` status row for this plan.

**Out of scope**:

- Do not change Supabase migrations or schema in this plan.
- Do not add Gemini grading for deterministic exercises.
- Do not redesign the whole practice UI or home page.
- Do not change SRS scheduling rules.
- Do not touch current uncommitted deck/home/daily files unless they are already
  in scope and necessary for this plan. At planning time there were local
  changes in `app/practice/decks/page.tsx`,
  `components/daily/SessionOpeningBanner.tsx`,
  `components/home/HomeHeaderGreeting.tsx`, and
  `components/practice/decks/DecksIndexClient.tsx`.

## Git workflow

- Branch: `codex/018-beginner-exercise-feedback`
- Commit message style: conventional commits, e.g.
  `feat(exercises): add pedagogical feedback contract`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Define the shared feedback contract

Add a shared type for pedagogical exercise feedback. Prefer putting it near the
existing practice answer contract if it is mostly session-facing, for example in
`lib/practice/types.ts`, or in a new `lib/exercises/feedback.ts` if the executor
wants it reusable by AI Coach and exercise components.

The type must support at least:

```ts
export type PedagogicalFeedback = {
  immediate: string
  explanation?: string
  correction?: string
  tip?: string
  example?: string
  expectedAnswer?: string
  category?: string
  canRetry?: boolean
  nextAction?: 'continue' | 'retry' | 'review_hint'
}
```

Then extend:

- `PracticeSubmitHandler` extras from `{ score?: number }` to include
  `feedback?: PedagogicalFeedback`.
- `PracticeAnswer` / `ExerciseResult` to carry `feedback?: PedagogicalFeedback`.
- The local `ExerciseResult` interface in `components/exercises/ExerciseShell.tsx`
  to carry the same feedback.

Keep this backward compatible: all current call sites that only pass `score`
must still compile.

**Verify**: `pnpm type-check` -> it may fail only because call sites are not yet
adapted. If it fails for unrelated files, STOP.

### Step 2: Teach `ExerciseShell` to render useful feedback

Replace the generic `FeedbackBanner` with a component that can render:

- status line from `feedback.immediate` or a sensible fallback;
- explanation body;
- expected answer or correction;
- tip;
- example.

Behavior:

- Correct answers may auto-continue after a short delay only if there is no
  detailed feedback to read.
- Incorrect answers must not auto-advance when `feedback.explanation`,
  `feedback.tip`, `feedback.example`, or `feedback.correction` exists.
- Keep the explicit Continue button.
- Add an optional Retry button only when `feedback.canRetry` is true. Wire it via
  a new optional `onRetry` prop on `ExerciseShell`.

Keep visual style token-based and compact. Do not create nested cards.

Add or update tests in `components/exercises/__tests__/ExerciseShell.test.tsx`:

- correct result without detailed feedback can auto-continue;
- wrong result with explanation does not auto-continue within the old 900 ms;
- detailed feedback renders explanation, tip and expected answer/correction;
- retry button appears only when `canRetry` is true.

**Verify**:
`pnpm test -- components/exercises/__tests__/ExerciseShell.test.tsx` -> all pass.

### Step 3: Build deterministic feedback for generic exercise types

Create a pure helper that maps existing generic exercise payloads and answers to
`PedagogicalFeedback`. Suggested path:
`lib/exercises/feedback.ts`.

Implement deterministic feedback for:

- `fill_blank`: expected answer, sentence with answer filled, existing hint as
  tip, early-learner wording.
- `sentence_dictation`: expected sentence, short explanation that dictation is
  about sound-to-text mapping, optional note about replaying slow audio.
- `reorder_words`: expected sentence / correct order, tip about word order.
- `multiple_choice`: use `exercise.explanation` when available; always include
  the correct option as expected answer.
- `match_pairs`: identify correct pair count if available from component state;
  if not available, provide generic explanation and expected pair summary.
- `written_production` and `spoken_production`: adapt existing
  `ProductionGradeResult` to the shared feedback contract.

If the existing `EvaluationResult` in `lib/exercises/design.ts` is easier to
reuse, write an adapter:

```ts
function pedagogicalFeedbackFromEvaluation(result: EvaluationResult): PedagogicalFeedback
```

Do not force every existing `GenericExercise` into `ExerciseDesign` if that
requires large generator rewrites. This plan favors a small deterministic
adapter around the current payloads.

Add tests under `lib/exercises/__tests__/feedback.test.ts`:

- fill blank wrong answer includes expected answer and example;
- multiple choice uses explanation;
- reorder wrong answer includes correct order;
- dictation feedback uses full sentence;
- correct answers still get a concise positive feedback.

**Verify**:
`pnpm test -- lib/exercises/__tests__/feedback.test.ts` -> all pass.

### Step 4: Thread feedback through generic exercise rendering

Update `GenericRenderExtras` in
`lib/practice/exercise-renderer/generic-registry.tsx` to include
`feedback?: PedagogicalFeedback`.

Update generic exercise components so they pass feedback in `onResult`:

- `FillBlankExercise.tsx`
- `SentenceDictationExercise.tsx`
- `ReorderWordsExercise.tsx`
- `MultipleChoiceExercise.tsx`
- `MatchPairsExercise.tsx`
- production components if their result already has AI feedback.

Prefer calling the pure helper from Step 3 inside each component at the moment
the learner submits. Do not duplicate explanation strings across components.

Update `GenericExerciseView.handleResult()` to store and submit
`extras.feedback`. Production should keep immediate submit behavior only if its
component already displays rich feedback before calling `onResult`; otherwise
let `ExerciseShell` own the feedback display for consistency.

**Verify**:
`pnpm type-check` -> exit 0.

### Step 5: Add retry support for beginner-friendly mistakes

For non-production generic exercises, add one guided retry path:

- If the first answer is wrong and feedback says `canRetry: true`, show the
  detailed feedback and a Retry button.
- Retry should reset the child exercise UI without recording another result yet.
  Reuse existing `retryKey` patterns if possible.
- If the learner retries and answers again, then submit the final result.
- If the learner taps Continue after the first wrong answer, submit the wrong
  result normally.

Keep the implementation local to generic exercise UI if possible. Avoid changing
the global session state machine unless needed. If the global `hints` phase must
be generalized, keep phoneme behavior unchanged and add tests around both
phoneme and generic paths.

Add tests in `components/practice/__tests__/PracticeSession.test.tsx` or a new
focused session test:

- wrong generic answer with retry-capable feedback does not immediately advance;
- Retry re-renders the same exercise;
- Continue records the wrong result and advances;
- correct answer still advances as before.

**Verify**:
`pnpm test -- components/practice/__tests__/PracticeSession.test.tsx components/exercises/__tests__/ExerciseShell.test.tsx` -> all pass.

### Step 6: Persist minimal feedback metadata for future analytics

Extend `exercisePayload` for generic answers in
`components/practice/session/useSessionState.ts` to include non-sensitive
feedback metadata:

- `feedbackCategory`
- `expectedAnswer`
- `hintUsed` if available
- `nextAction` if available

Do not store long AI feedback text in `answer_history` from this plan. For
production exercises, keep existing answer payload shape unless a small category
can be stored safely. The goal is future error analysis, not logging full
private responses.

Update tests for `savePracticeAnswer` / session result payload if they assert
the payload shape.

**Verify**:
`pnpm test -- lib/practice components/practice` -> relevant tests pass.

### Step 7: Document the contract

Update `docs/architecture/exercises.md`:

- Replace the generic "feedback visual correcto/incorrecto" wording with the
  new feedback contract.
- Document which fields are shown to learners.
- Document that beginner support is deterministic first; Gemini is only for
  production grading unless a future plan adds AI explanations.
- Mention that feedback metadata may be persisted in `exercise_payload` for
  analytics, but long feedback text is not stored by default.

**Verify**:
`pnpm lint` -> exit 0.

## Test plan

Add or update tests:

- `components/exercises/__tests__/ExerciseShell.test.tsx`
  - detailed wrong feedback does not auto-advance;
  - feedback fields render;
  - retry button behavior.
- `lib/exercises/__tests__/feedback.test.ts`
  - deterministic feedback for fill blank, dictation, reorder and multiple
    choice.
- `components/practice/__tests__/PracticeSession.test.tsx` or a nearby focused
  test:
  - generic wrong answer can pause for feedback/retry;
  - continue records result and advances.

Full verification before marking done:

- `pnpm type-check` -> exit 0
- `pnpm lint` -> exit 0
- `pnpm test` -> all tests pass

## Done criteria

All must hold:

- [ ] `PracticeSubmitHandler` and `ExerciseResult` support
  `PedagogicalFeedback` without breaking existing score-only call sites.
- [ ] `ExerciseShell` renders immediate message, explanation, tip,
  correction/expected answer and example when present.
- [ ] Wrong generic answers with meaningful feedback do not auto-advance before
  the learner can read.
- [ ] At least fill blank, sentence dictation, reorder words and multiple choice
  produce deterministic feedback.
- [ ] One guided retry path exists for beginner-friendly generic mistakes.
- [ ] Minimal feedback metadata is included in generic `exercisePayload` without
  storing long AI text.
- [ ] New tests exist and pass.
- [ ] `pnpm type-check`, `pnpm lint`, and `pnpm test` all exit 0.
- [ ] `docs/architecture/exercises.md` documents the feedback contract.
- [ ] `plans/README.md` status row for plan 018 is updated.

## STOP conditions

Stop and report if:

- Current code at the excerpted locations no longer matches the plan.
- Implementing feedback requires changing Supabase schema.
- Deterministic feedback requires rewriting exercise generators broadly.
- Production grading needs new Gemini prompts or API routes.
- Tests reveal that generic retry conflicts with phoneme `hints` behavior.
- `pnpm type-check` or focused tests fail twice after reasonable fixes.

## Maintenance notes

- This plan intentionally avoids AI-generated explanations for deterministic
  exercises. A later plan can add optional model explanations after the contract
  exists.
- Reviewers should scrutinize copy quality for A1/A2: concise, specific,
  non-patronizing, and actionable.
- Reviewers should check that feedback strings are centralized in helpers, not
  duplicated across components.
- Future analytics can use `feedbackCategory` and `expectedAnswer` to build an
  error history, but avoid storing long free-form feedback unless there is a
  privacy decision.
