# Plan 020: Finish the unified progress hub so every practice surface records the same session contract

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 0e25aca..HEAD -- lib/progress lib/practice lib/phoneme-practice lib/ai-practice components/practice app/progress supabase/migrations`

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/019-reconcile-ci-gates.md
- **Category**: architecture
- **Planned at**: commit `0e25aca`, 2026-06-21

## Why this matters

The product promise depends on progress feeling real, not just counted. The app
already has `answer_history`, `activity_sessions`, contrast mastery, AI Coach
state, and daily reconciliation, but those are still partly independent systems.
This plan finishes the progress hub by making every completed practice session
emit one normalized session summary and one normalized set of answer-level
records.

## Current state

- `lib/progress/activity-hub.ts` is intended as the single exit point:

```ts
# lib/progress/activity-hub.ts:88-95
/**
 * Single exit point when a practice session completes.
 * Persists a summary row and reconciles the daily plan (best-effort).
 */
export async function recordActivitySession(
  userId: string,
  input: ActivitySessionInput,
): Promise<RecordActivityOutcome> {
```

- `recordActivitySession` enqueues only an `activity_sessions` insert:

```ts
# lib/progress/activity-hub.ts:134-138
try {
  await enqueue('activity_sessions', 'insert', row as Record<string, unknown>)
} catch (err) {
  console.error('[activity-hub] enqueue activity_sessions failed', err)
}
```

- Contrast practice updates its own progress directly, then flushes the outbox:

```ts
# lib/phoneme-practice/finish-session.ts:83-84
await updateContrastProgress(userId, contrastId, correct, total, sr, masteryPct)
await flushOutbox()
```

- AI Coach persists answer-level results directly:

```ts
# lib/ai-practice/coach-progress.ts:39-47
export async function persistCoachExerciseResult(
  userId: string,
  toolName: string,
  result: ExerciseResult,
): Promise<void> {
  const answer = buildCoachPracticeAnswer(toolName, result)
  if (!answer) return
  await savePracticeAnswer(userId, answer)
}
```

- The progress page aggregates from multiple sources:

```ts
# lib/progress/queries.ts:405-417
export async function getProgressPageData(userId: string): Promise<ProgressPageData> {
  const [streak, dailyCompletion, accuracy, skillProfile, weeklySummary, coachInsights, recentSessions] =
    await Promise.all([
      getDailyStreak(userId),
      getDailyCompletionStats(userId),
      getAccuracyStats(userId),
      getSkillProfileData(userId),
      getWeeklySummaryStats(userId),
      getCoachInsights(userId),
      getRecentActivitySessions(userId),
    ])
```

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `pnpm type-check` | exit 0 |
| Focus tests | `pnpm test -- lib/progress lib/practice lib/phoneme-practice lib/ai-practice` | relevant tests pass |
| Full tests | `pnpm test` | all tests pass |
| Lint | `pnpm lint` | exit 0 |

## Scope

**In scope**:

- `lib/progress/activity-hub.ts`
- `lib/progress/activity-types.ts`
- `lib/progress/queries.ts`
- `lib/practice/types.ts`
- `lib/practice/session-result.ts`
- `lib/practice/queries.ts`
- `lib/phoneme-practice/finish-session.ts`
- `lib/ai-practice/coach-progress.ts`
- Tests under `lib/progress/__tests__`, `lib/practice/__tests__`,
  `lib/phoneme-practice/__tests__`, and `lib/ai-practice/__tests__`
- `docs/architecture/progress.md` if it exists; otherwise create it.
- `plans/README.md`

**Out of scope**:

- Do not redesign the progress UI.
- Do not add new Supabase tables unless the current `activity_sessions` and
  `answer_history` schema cannot represent the needed data.
- Do not change SRS math in this plan.
- Do not migrate historical data.

## Git workflow

- Branch: `codex/020-complete-progress-hub`
- Commit message: `feat(progress): centralize session telemetry`
- Do not push or open a PR unless instructed.

## Steps

### Step 1: Define one session telemetry contract

In `lib/progress/activity-hub.ts` or a new `lib/progress/session-contract.ts`,
define a pure contract that accepts:

- `userId`
- `practiceContext`
- `sessionResult`
- optional `source`
- optional `dailyPlanSteps`
- optional domain metadata such as `contrastId`, `lessonSlug`, or `coachTool`

It must produce:

- the `activity_sessions` row;
- the list of normalized `PracticeAnswer` rows already represented in
  `sessionResult.results`;
- the reconciled daily step IDs;
- derived `skillTags`.

Keep it pure where possible, with a small persistence wrapper.

**Verify**: add a unit test in `lib/progress/__tests__/activity-hub.test.ts`
that builds a mixed session and asserts source, skill tags, accuracy, XP, and
reconciled IDs.

### Step 2: Make AI Coach use the hub for completed sessions

Keep `buildCoachPracticeAnswer` for individual widget results, but add a path
that batches completed AI Coach exercises into a `SessionResult` and calls
`recordActivitySession`.

Do not remove `savePracticeAnswer` until there is a test proving answer-level
records still persist. If the UI currently records each widget immediately,
preserve that behavior and add a session-summary call at the end of a coherent
coach practice session.

**Verify**: extend `lib/ai-practice/__tests__/coach-progress.test.ts` to assert
that coach answers can be represented as a session summary without changing
their `answer_history` payload.

### Step 3: Make contrast practice emit a session summary

In `lib/phoneme-practice/finish-session.ts`, after contrast progress is updated,
record the session through the hub with source `sound_lab` or the mapped
practice context. Keep `updateContrastProgress` as the source of contrast
mastery; the hub is for unified telemetry, not replacing mastery state.

**Verify**: extend `lib/phoneme-practice/__tests__/finish-session.test.ts` to
assert that finishing a contrast session records or prepares a normalized
activity summary.

### Step 4: Simplify progress-page reads around the hub

Keep existing metrics, but make `getProgressPageData` prefer `activity_sessions`
for recent-session and weekly-summary calculations. Keep `answer_history` for
answer-level accuracy and detailed skill calculations.

Avoid duplicating date-window logic across functions. If you add helpers, keep
them in `lib/progress/queries.ts` or a focused `lib/progress/windows.ts`.

**Verify**: update `lib/progress/__tests__/daily-reconcile.test.ts` or add a new
query-mapping test that asserts weekly summary semantics.

### Step 5: Document the model

Create or update `docs/architecture/progress.md` with:

- the single write path;
- which tables store summary vs answer-level data;
- which domains may still keep specialized state, such as contrast mastery;
- what future practice surfaces must call when a session completes.

**Verify**: `pnpm lint` -> exit 0.

## Test plan

Add or update tests for:

- pure session telemetry row construction;
- AI Coach session summary mapping;
- contrast session summary mapping;
- weekly summary query semantics.

Full verification:

- `pnpm type-check`
- `pnpm test`
- `pnpm lint`

## Done criteria

- [ ] A single documented contract exists for completed practice-session
  telemetry.
- [ ] AI Coach, contrast practice, and generic practice can all produce the same
  normalized session summary shape.
- [ ] `activity_sessions` is the primary source for recent session summaries.
- [ ] Specialized domain state, such as contrast mastery, remains intact.
- [ ] Tests cover the new mappings.
- [ ] `pnpm type-check`, `pnpm test`, and `pnpm lint` exit 0.

## STOP conditions

Stop and report if:

- The change requires a Supabase schema migration.
- You cannot identify where a practice surface completes a coherent session.
- The hub would require storing long AI feedback or private transcript text in
  `activity_sessions`.
- Existing contrast mastery tests fail twice after reasonable fixes.

## Maintenance notes

Future practice features should not write their own progress summaries. They
should build `SessionResult`, call the hub, and keep only truly domain-specific
state in their own module.
