# Plan 021: Add an error taxonomy so beginner feedback and progress analytics explain why answers fail

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 0e25aca..HEAD -- lib/exercises lib/practice components/exercises components/practice docs/architecture`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/019-reconcile-ci-gates.md
- **Category**: direction
- **Planned at**: commit `0e25aca`, 2026-06-21

## Why this matters

The app now has a shared pedagogical feedback shape, but much of the evaluation
is still correct/incorrect with a generic reason. For A1/A2 learners, the useful
question is not only "what was correct?" but "what kind of mistake did I make?"
This plan adds a stable error taxonomy that can power better feedback,
analytics, and future review queues without adding AI grading to deterministic
exercises.

## Current state

- Deterministic evaluation exists:

```ts
# lib/exercises/evaluator.ts:56-60
export function evaluateExercise(
  userAnswer: string,
  design: ExerciseDesign,
  userLevel?: CEFRLevel
): EvaluationResult {
```

- Generic wrong answers collapse to `form_error` or `unknown_error`:

```ts
# lib/exercises/evaluator.ts:201-207
function genericWrongResult(
  userAnswer: string,
  design: ExerciseDesign,
  userLevel?: CEFRLevel
): EvaluationResult {
  const levelOfWrongness = analyzeWrongness(userAnswer, design);
  const isEarlyLearner = !userLevel || cefrToNumber(userLevel) <= 2;
```

- Shared feedback exists, but categories are local strings:

```ts
# lib/exercises/feedback.ts:13-18
export function buildPedagogicalFeedback(
  exercise: GenericExercise,
  isCorrect: boolean,
  userAnswer: string,
  meta?: { correctPairCount?: number; totalPairCount?: number; hintUsed?: boolean },
): PedagogicalFeedback {
```

- `answerToGrade` is still mostly binary/time-based except for score-carrying
  exercise types:

```ts
# lib/practice/grade.ts:20-23
if (answer.isCorrect === false) return 1
if (answer.timeMs < FAST_THRESHOLD_MS) return 5
if (answer.timeMs < NORMAL_THRESHOLD_MS) return 4
return 3
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Feedback tests | `pnpm test -- lib/exercises components/exercises` | relevant tests pass |
| Practice tests | `pnpm test -- lib/practice components/practice` | relevant tests pass |
| Full tests | `pnpm test` | all tests pass |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:

- `lib/exercises/feedback.ts`
- `lib/exercises/evaluator.ts`
- `lib/exercises/design.ts`
- `lib/practice/types.ts`
- `components/exercises/*Exercise.tsx` only where needed to pass taxonomy meta
- `components/practice/session/*` only where needed to persist metadata
- Tests under `lib/exercises/__tests__`, `components/exercises/__tests__`, and
  `components/practice/__tests__`
- `docs/architecture/exercises.md`
- `plans/README.md`

**Out of scope**:

- Do not add Gemini explanations for deterministic exercises.
- Do not redesign the practice UI.
- Do not change SRS scheduling.
- Do not store long free-form feedback text in Supabase.

## Git workflow

- Branch: `codex/021-error-taxonomy-feedback-quality`
- Commit message: `feat(exercises): add deterministic error taxonomy`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Define a typed error taxonomy

Create a union type such as:

```ts
export type ExerciseErrorCode =
  | 'correct'
  | 'empty_answer'
  | 'form_error'
  | 'word_order'
  | 'listening_omission'
  | 'meaning_choice'
  | 'target_not_used'
  | 'pair_mapping'
  | 'unknown'
```

Put it near `PedagogicalFeedback` or in `lib/exercises/error-taxonomy.ts`.
Extend `PedagogicalFeedback` with `errorCode?: ExerciseErrorCode` while keeping
the existing `category?: string` field for compatibility.

**Verify**: `pnpm type-check` may fail only until call sites are adapted.

### Step 2: Map generic exercise feedback to error codes

Update `buildPedagogicalFeedback` so every supported exercise type sets a stable
`errorCode`.

Minimum mapping:

- `fill_blank`: `correct`, `empty_answer`, `form_error`, or `meaning_choice`
- `sentence_dictation`: `correct` or `listening_omission`
- `reorder_words`: `correct` or `word_order`
- `multiple_choice`: `correct` or `meaning_choice`
- `match_pairs`: `correct` or `pair_mapping`
- production exercises: `target_not_used` when target item is missing, otherwise
  a production-specific category can remain as `category`

**Verify**: add tests in `lib/exercises/__tests__/feedback.test.ts` for each
mapping.

### Step 3: Improve deterministic error detection without broad rewrites

Improve `analyzeWrongness` only where cheap and deterministic:

- empty input is `empty_answer`;
- same tokens in wrong order is `word_order`;
- short dictation answers missing words are `listening_omission`;
- known common wrong answers keep their specific category and get an error code.

Do not add fuzzy NLP libraries or AI calls.

**Verify**: add unit tests for token-order and omitted-word cases.

### Step 4: Persist minimal taxonomy metadata

Where `exercisePayload` is built for `PracticeAnswer`, include:

- `feedbackCategory`
- `errorCode`
- `expectedAnswer`
- `hintUsed` when known

Do not store `explanation`, `tip`, `correction`, or long learner text beyond
what is already stored today.

**Verify**: update practice/session tests that assert payload shape.

### Step 5: Document how feedback quality is evaluated

Update `docs/architecture/exercises.md` with:

- the error-code taxonomy;
- which exercise types produce which codes;
- privacy rule: persist short codes and expected answers, not long explanations;
- examples of beginner-friendly feedback copy for two wrong answers.

**Verify**: `pnpm lint` -> exit 0.

## Test plan

Add tests for:

- every taxonomy mapping listed above;
- wrong word order detection;
- dictation omission detection;
- persisted `errorCode` metadata in generic practice answers.

Full verification:

- `pnpm type-check`
- `pnpm test`
- `pnpm lint`

## Done criteria

- [ ] `ExerciseErrorCode` is a typed union, not ad hoc strings scattered across
  components.
- [ ] Generic exercise feedback includes stable `errorCode` values.
- [ ] Practice answer payloads persist short taxonomy metadata only.
- [ ] Tests cover at least fill blank, dictation, reorder, multiple choice, and
  match pairs.
- [ ] `docs/architecture/exercises.md` documents the taxonomy.
- [ ] `pnpm type-check`, `pnpm test`, and `pnpm lint` exit 0.

## STOP conditions

Stop and report if:

- Implementing taxonomy requires changing Supabase schema.
- Production feedback requires new Gemini prompts.
- The codebase already added a different taxonomy after this plan was written.
- Tests reveal existing persisted payload consumers depend on the exact old
  shape and need a migration.

## Maintenance notes

Reviewers should scrutinize whether each error code is stable enough for
analytics. Copy can evolve, but error codes should be treated as data contracts.
