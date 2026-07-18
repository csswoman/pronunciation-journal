# Plan 045: Make standalone Reader a first-class practice mode and share completion orchestration with Daily

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving on. Do not
> redesign Reader or change its pedagogical selection rules. If anything in
> "STOP conditions" occurs, stop and report; do not improvise. When done,
> update this plan's row in `plans/README.md` unless a reviewer says they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 5cfb8dad..HEAD -- "app/(authenticated)/practice/reader" components/practice/reader components/daily/DailyReaderStep.tsx lib/practice/reader lib/practice/practice-modes.ts lib/practice/__tests__/practice-modes.test.ts`
> If any in-scope file
> changed, compare it with the current-state facts below. Treat a material
> mismatch as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction / tech-debt / tests
- **Planned at**: commit `5cfb8dad`, 2026-07-17

## Why this matters

Reader is fully implemented both as a Daily-plan step and as an authenticated
standalone page, but the standalone route has no internal link and therefore
cannot be discovered from the product. The two surfaces reuse `ReaderExercise`
but duplicate completion persistence and online-state handling, allowing their
telemetry behavior to drift. This plan makes the deliberate standalone route a
first-class practice mode while preserving Daily behavior and Reader's current
target-selection, caching, offline, and comprehension contracts.

## Current state

- `app/(authenticated)/practice/reader/page.tsx` renders `ReaderEntry` and is
  reachable only by entering the URL directly.
- `lib/practice/practice-modes.ts:14-50` is the practice hub's source of truth;
  it contains sounds, Essential Words, decks, review, and courses, but no Reader.
- `components/practice/hub/PracticeOptionsGrid.tsx:14-35` renders every item in
  `PRACTICE_MODES`, so adding the mode there makes the route discoverable.
- `components/practice/hub/RecommendedPracticeCard.tsx:12-18` already maps the
  `BookOpen` icon needed by Reader; no icon-registry change is required.
- `components/practice/reader/ReaderEntry.tsx:36-63` loads `word_bank`, maps it
  to `ReaderTargetRow`, selects targets, resolves cache/generation, and renders
  the standalone state machine. Preserve this source behavior.
- `lib/practice/daily-plan/async-step-builders.ts:87-116` builds Daily Reader
  from Daily-provided SRS rows. Preserve that separate upstream input.
- `ReaderEntry.tsx:110-128` and
  `components/daily/DailyReaderStep.tsx:39-58` independently build the same
  multiple-choice result, call `savePracticeAnswer`, record an activity session,
  and flush the outbox. They differ only in context (`practice` vs `daily`) and
  the Daily `onComplete` callback.
- Both components initialize `online` from `navigator.onLine` once. They do not
  subscribe to connectivity changes; preserve this behavior unless a focused
  test proves a shared hook can change it safely.
- `components/practice/reader/__tests__/ReaderExercise.test.tsx` covers exercise
  rendering and completion UI, but there is no standalone `ReaderEntry` test or
  shared completion-orchestration test.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Mode tests | `pnpm test -- lib/practice/__tests__/practice-modes.test.ts` | all pass |
| Reader tests | `pnpm test -- components/practice/reader lib/practice/reader components/daily` | all focused tests pass |
| Typecheck | `pnpm type-check` | exit 0, no errors |
| Scoped lint | `pnpm exec eslint "app/(authenticated)/practice/reader/page.tsx" components/practice/reader components/daily/DailyReaderStep.tsx lib/practice/reader lib/practice/practice-modes.ts lib/practice/__tests__/practice-modes.test.ts` | exit 0 |
| Reference check | `git grep -n -I -F -- '/practice/reader' -- app components hooks lib` | route definition plus canonical mode entry; no ad-hoc duplicate links required |

## Suggested executor toolkit

- Invoke `vercel-react-best-practices` if available when extracting shared
  client orchestration. Keep imports statically analyzable and do not create a
  barrel file solely for this change.
- Match the existing query/orchestration boundary: UI event handlers may call a
  domain function under `lib/practice/reader/`; Supabase access must not be
  introduced directly into components.

## Scope

**In scope**:

- `lib/practice/practice-modes.ts`.
- `lib/practice/__tests__/practice-modes.test.ts`.
- `components/practice/reader/ReaderEntry.tsx`.
- `components/daily/DailyReaderStep.tsx`.
- Create `lib/practice/reader/complete-reader.ts`.
- Create `lib/practice/reader/__tests__/complete-reader.test.ts`.
- Create `components/practice/reader/__tests__/ReaderEntry.test.tsx` if needed
  to characterize standalone loading and completion wiring.
- `app/(authenticated)/practice/reader/page.tsx` only for concise metadata or
  route-level composition required by the final implementation.

**Out of scope**:

- Changes to the Daily composer, target priority, target count, Gemini prompt,
  passage refinement, cache schema, or `reader_passages` table.
- Redesigning `ReaderExercise`, changing question scoring, or adding new
  exercise types.
- Making Reader the recommended default practice mode or changing fallback
  recommendation logic.
- Translating or broadly rewriting Reader copy.
- Changes to `cleanup-audio`, `/api/words`, redirects, or `/test`.

## Git workflow

- Branch: `codex/045-promote-standalone-reader`.
- Use conventional commits, for example
  `feat(practice): expose standalone reader mode`.
- Do not push or open a PR unless the operator explicitly requests it.

## Steps

### Step 1: Add a characterization test for the mode registry

Extend `lib/practice/__tests__/practice-modes.test.ts` with an explicit assertion
that a Reader mode exists exactly once and has:

```ts
{
  id: 'reader',
  label: 'Reading',
  description: 'Practice your recent words in context',
  href: '/practice/reader',
  icon: 'BookOpen',
}
```

Do not make Reader the fallback or alter `resolveRecommendedMode` behavior.

**Verify**: run the mode test before implementation and confirm the new
assertion fails only because the mode is absent.

### Step 2: Expose Reader through the existing practice registry

Add the Reader entry to `PRACTICE_MODES` in a position that keeps core practice
actions ahead of courses. Do not add a one-off link to the hub component;
`PracticeOptionsGrid` must continue deriving options from the registry.
`BookOpen` is already registered in `MODE_ICONS`.

**Verify**: `pnpm test -- lib/practice/__tests__/practice-modes.test.ts` passes,
including uniqueness and absolute-route assertions.

### Step 3: Extract one reader-completion orchestration function

Create `lib/practice/reader/complete-reader.ts` with a small typed API similar
to:

```ts
type CompleteReaderInput = {
  userId: string
  passageId: string
  correct: boolean
  context: 'practice' | 'daily'
}

export async function completeReader(input: CompleteReaderInput): Promise<void>
```

The function must preserve the current contract exactly:

1. Build one result with `exerciseId: reader:<passageId>`,
   `slug: 'multiple_choice'`, `exerciseTypeId: 17`, `timeMs: 0`, the passage ID
   as `contentId`, the supplied context, and a single captured completion date.
2. Await `savePracticeAnswer`.
3. Await `recordActivitySession` with `practiceContext` equal to the supplied
   context, `source: 'practice'`, and `buildSessionResult([result])`.
4. Await `flushOutbox`.

Do not swallow errors; `ReaderExercise` already displays save failure when its
`onComplete` rejects. Do not move target selection or passage generation into
this function.

**Verify**: add focused unit tests that mock the three side effects and prove
call order, context propagation for both allowed contexts, result shape, and
error propagation. Run:

```powershell
pnpm test -- lib/practice/reader/__tests__/complete-reader.test.ts
```

Expected: all new tests pass.

### Step 4: Switch both surfaces to the shared completion function

- In `ReaderEntry`, replace the inline result construction and three persistence
  calls with `completeReader({ userId: user.id, passageId: state.passage.id,
  correct, context: 'practice' })`.
- In `DailyReaderStep`, call the same function with `context: 'daily'`, then call
  its existing `onComplete()` only after persistence resolves.
- Remove imports made obsolete by the extraction.
- Keep the standalone load state, Daily thread hints, wrappers, and online-state
  behavior unchanged.

**Verify**:

```powershell
pnpm test -- components/practice/reader lib/practice/reader components/daily
pnpm type-check
```

Expected: all focused tests and typecheck pass.

### Step 5: Characterize the standalone route boundary

Add a focused `ReaderEntry` test only if the existing suite cannot prove the
standalone wiring. Model it after `ReaderExercise.test.tsx` and cover:

- fewer than three eligible targets produces the existing empty state without
  calling passage generation;
- eligible rows resolve a passage and render `ReaderExercise`;
- completion calls the new shared function with `context: 'practice'`;
- a rejected load displays the existing retry action.

Mock auth, `getMyWords`, passage resolution, and the shared completion function;
do not call Supabase, Gemini, Dexie, or the network.

**Verify**: the focused test passes under jsdom and does not depend on test
execution order.

### Step 6: Run final scoped checks

```powershell
pnpm test -- lib/practice/__tests__/practice-modes.test.ts components/practice/reader lib/practice/reader components/daily
pnpm type-check
pnpm exec eslint "app/(authenticated)/practice/reader/page.tsx" components/practice/reader components/daily/DailyReaderStep.tsx lib/practice/reader lib/practice/practice-modes.ts lib/practice/__tests__/practice-modes.test.ts
git diff --check
```

Expected: every command exits 0.

## Test plan

- Registry: Reader exists once, points to `/practice/reader`, uses `BookOpen`,
  and does not change recommendation fallback behavior.
- Shared orchestration: both contexts, exact result contract, ordered awaited
  side effects, and propagated failure.
- Standalone boundary: empty, ready, completion, and retry/error states if those
  are not already covered after extraction.
- Existing `ReaderExercise` tests must remain unchanged unless import wiring
  requires a minimal update; their behavioral assertions must not be weakened.

## Done criteria

- [ ] `/practice/reader` is discoverable through `PRACTICE_MODES` and therefore the practice hub.
- [ ] Reader is not made the recommendation fallback.
- [ ] `ReaderEntry` and `DailyReaderStep` call one shared completion function.
- [ ] The shared function preserves the current answer/activity/outbox contract and propagates failures.
- [ ] Target selection, cache behavior, Daily inputs, and `ReaderExercise` behavior are unchanged.
- [ ] New focused tests pass, followed by typecheck and scoped ESLint.
- [ ] No files outside the in-scope list are modified, except `plans/README.md` status.

## STOP conditions

Stop and report instead of improvising if:

- Product requirements now say Reader must remain Daily-only.
- `PRACTICE_MODES` is no longer the practice hub's source of truth.
- The completion payload or `exerciseTypeId: 17` has changed since the plan SHA.
- Extraction requires changing `ReaderExercise`'s public contract or Daily-plan
  composition.
- Tests reveal that Daily and standalone intentionally persist different source
  or session contracts beyond the context value.
- A verification fails twice after a reasonable correction.

## Maintenance notes

- Future Reader surfaces should call `completeReader`; do not recreate the
  answer/activity/outbox sequence inside a component.
- If live online/offline updates are later required, create one shared
  connectivity hook as a separate change with event-listener cleanup tests.
- If Reader later becomes recommendable, update `resolveRecommendedMode` and its
  tests deliberately; registry presence alone should not change recommendation.
