# Bound getProgressProjections Query Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop `getProgressProjections` in [lib/progress/queries.ts](../../../lib/progress/queries.ts) from pulling every `activity_sessions`, `lesson_completions`, and `answer_history` row (including full `exercise_payload` JSON) a user has ever produced, on every `/progress` page load.

**Architecture:** Split the current three unbounded `select('*eq(user_id)')` queries into two lanes:
1. **Aggregate lane** — `sessions` (count + sum exercises/duration + distinct active days) and `completions` (count) no longer need row-level data at all; replace with two small Postgres RPCs that return pre-aggregated numbers.
2. **Evidence lane** — `answer_history.exercise_payload` parsing (`attributedAnswerFacts`) stays in TypeScript (it decodes a discriminated union that's type-checked there, not worth reimplementing in SQL), but the query is now bounded to a rolling window (`PROGRESS_PROJECTION_EVIDENCE_WINDOW_DAYS = 180`) instead of full history.

This is provably lossless for `activity`/`coverage` (pure aggregates, exact either way) and near-lossless for `learning.evidence` — `projectProgress` already keeps only the single most-recent fact per `targetId`, so a target only disappears from the evidence list if its *only* evidence is >180 days old, which is already stale enough that treating it as "not yet evidenced" is reasonable product behavior, not a regression.

**Tech Stack:** Next.js 16 (Server Components) · Supabase Postgres (RPC via `supabase.rpc()`) · Vitest

---

## Context you need

- [lib/progress/queries.ts:494-533](../../../lib/progress/queries.ts#L494-L533) — `getProgressProjections`, the function being changed.
- [lib/progress/queries.ts:451-492](../../../lib/progress/queries.ts#L451-L492) — `attributedAnswerFacts`, stays as-is, just receives fewer/bounded rows.
- [lib/progress/projections.ts](../../../lib/progress/projections.ts) — `projectProgress`, the pure reducer. **Do not modify its exported behavior for existing callers.** It already only keeps the latest fact per `targetId` (`projections.ts:66-70`), which is what makes the windowing safe.
- [lib/progress/queries.ts:110-116](../../../lib/progress/queries.ts#L110-L116) — existing window constants (`RECENT_ACTIVITY_SESSION_LIMIT`, `SKILL_PROFILE_CONTRAST_LIMIT`, `PROGRESS_ANSWER_WINDOW_DAYS = 30`). Add the new constant next to these, don't reuse `PROGRESS_ANSWER_WINDOW_DAYS` — that one is a 30-day dashboard window; projections need a longer window since it's replacing "all time," not a 30-day widget.
- Migration convention: filenames are `supabase/migrations/YYYYMMDDHHMMSS_description.sql`. Latest is `20260821100000_perf_indexes_and_rls_auth_uid.sql`. Use `20260822090000_progress_projection_aggregates.sql` for the new one (next day, keeps ordering unambiguous).
- Supabase migrations in this repo use lowercase `create` / `create or replace function` style (see `20260718160000_reconcile_prod_drift.sql`) — follow that style, not the `CREATE POLICY` uppercase style from the most recent migration; both exist in the repo, but match whichever file you're extending. This plan creates a new file, so lowercase is fine and matches the majority of the codebase.
- RLS: both RPCs run as the authenticated user calling with their own `auth.uid()`; do **not** accept `user_id` as a parameter trusted from the client — read it from `auth.uid()` inside the function body, and mark the functions `security invoker` (default) so RLS on the underlying tables still applies. This repo's hard rule is "RLS required on every new table before merging" — these are functions, not tables, but the same trust boundary applies: never let a client-supplied `user_id` bypass a user's own row scope.

---

## Task 1: Add SQL aggregate RPC for activity_sessions

**Files:**
- Create: `supabase/migrations/20260822090000_progress_projection_aggregates.sql`
- Test: `supabase/migrations/__tests__/` — check whether this dir has an existing pattern first (see Step 0 below); if migrations aren't unit-tested in this repo, skip to Task 1 Step 2 and rely on Task 3's integration-level query test plus manual `psql`/Supabase Studio verification.

- [ ] **Step 0: Check whether migrations have existing tests**

Run: `ls supabase/migrations/__tests__/`

If this lists `.sql` or `.ts` files that look like migration tests, read one to learn the pattern before continuing. If the directory is empty or doesn't exist, there is no migration test harness in this repo — proceed without adding one; correctness is verified via Task 3's Vitest coverage against the TypeScript query function plus a manual Supabase Studio / `supabase db diff` check before merging.

- [ ] **Step 2: Write the migration file**

```sql
-- Aggregate RPCs for /progress projections: avoid pulling full row-level
-- activity_sessions and lesson_completions history into the app for what
-- are ultimately just counts and sums. Both run as the calling user
-- (security invoker, the Postgres default) and read auth.uid() directly —
-- never trust a client-supplied user id.

create or replace function public.get_activity_totals()
returns table (
  sessions bigint,
  exercises bigint,
  duration_ms bigint,
  active_days bigint
)
language sql
stable
as $$
  select
    count(*)::bigint as sessions,
    coalesce(sum(exercises_total), 0)::bigint as exercises,
    coalesce(sum(duration_ms), 0)::bigint as duration_ms,
    count(distinct (completed_at at time zone 'utc')::date)::bigint as active_days
  from public.activity_sessions
  where user_id = (select auth.uid())
$$;

comment on function public.get_activity_totals() is
  'Lifetime activity_sessions aggregate for the /progress projections panel. Replaces an unbounded row fetch — see lib/progress/queries.ts getProgressProjections.';

create or replace function public.get_lesson_completion_total()
returns bigint
language sql
stable
as $$
  select count(*)::bigint
  from public.lesson_completions
  where user_id = (select auth.uid())
$$;

comment on function public.get_lesson_completion_total() is
  'Lifetime lesson_completions count for the /progress projections panel. Replaces an unbounded row fetch — see lib/progress/queries.ts getProgressProjections.';

grant execute on function public.get_activity_totals() to authenticated;
grant execute on function public.get_lesson_completion_total() to authenticated;
```

- [ ] **Step 3: Apply the migration locally**

Run: `pnpm supabase db reset` (or the project's equivalent local-apply command — check `package.json` scripts for a `db:` prefix first with `grep '"db' package.json` if `supabase db reset` isn't set up)

Expected: migration applies with no errors.

- [ ] **Step 4: Manually verify the RPCs in Supabase Studio or via SQL**

Run against a local/dev user that has at least one `activity_sessions` row:

```sql
select * from public.get_activity_totals();
select public.get_lesson_completion_total();
```

Expected: `get_activity_totals()` returns one row with plausible `sessions`/`exercises`/`duration_ms`/`active_days` values; `get_lesson_completion_total()` returns a single bigint. Compare against `select count(*) from activity_sessions where user_id = '<test-uid>'` run manually to confirm the numbers match.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260822090000_progress_projection_aggregates.sql
git commit -m "feat(progress): add aggregate RPCs for projection totals"
```

---

## Task 2: Add the evidence-window constant

**Files:**
- Modify: `lib/progress/queries.ts:110-116`

- [ ] **Step 1: Add the new constant next to the existing window constants**

Read [lib/progress/queries.ts:108-116](../../../lib/progress/queries.ts#L108-L116) first to match exact formatting, then add:

```ts
/**
 * Rolling window (days) for exercise_payload evidence pulled into
 * projections' "latest evidence per target" list. projectProgress only
 * ever keeps the single most-recent fact per target, so a target drops
 * out of the list only if its sole evidence predates this window — at
 * which point treating it as not-yet-evidenced is reasonable, not a bug.
 */
export const PROGRESS_PROJECTION_EVIDENCE_WINDOW_DAYS = 180
```

Place it directly below `export const PROGRESS_ANSWER_WINDOW_DAYS = 30` so the three window constants stay grouped.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: no errors (unused-export warnings are fine at this point; Task 3 consumes it).

- [ ] **Step 3: Commit**

```bash
git add lib/progress/queries.ts
git commit -m "feat(progress): add evidence window constant for projections"
```

---

## Task 3: Rewrite getProgressProjections to use the aggregates + bounded evidence window

**Files:**
- Modify: `lib/progress/queries.ts:494-533`
- Modify: `lib/progress/projections.ts`
- Test: `lib/progress/__tests__/queries.test.ts`
- Test: `lib/progress/__tests__/projections.test.ts` (must keep passing unmodified — do not edit its assertions)

- [ ] **Step 1: Read the current test file to match existing mocking conventions**

Run: `cat lib/progress/__tests__/queries.test.ts` (or Read the file) and note how `createSupabaseServerClient` is mocked for existing tests — reuse the exact same mock shape (likely a chainable `.from().select().eq()...` builder mock, possibly via `vi.mock('@/lib/supabase/server', ...)`). Do not invent a different mocking style.

Also read `lib/progress/__tests__/projections.test.ts` in full (it's 51 lines) so you know the exact four existing test cases that must keep passing unmodified after Step 4's `projectProgress` signature change.

- [ ] **Step 2: Write the failing test**

Add to `lib/progress/__tests__/queries.test.ts` (adapt the mock setup to match what Step 1 found — the shape below assumes a chainable builder mock is already in scope as `mockSupabase`/`createSupabaseServerClient` per the file's existing pattern; wire it the same way the file's other `describe` blocks do):

```ts
describe('getProgressProjections', () => {
  it('calls the aggregate RPCs instead of fetching full activity_sessions/lesson_completions rows', async () => {
    const rpc = vi.fn((fn: string) => {
      if (fn === 'get_activity_totals') {
        return Promise.resolve({
          data: [{ sessions: 3, exercises: 12, duration_ms: 45000, active_days: 2 }],
          error: null,
        })
      }
      if (fn === 'get_lesson_completion_total') {
        return Promise.resolve({ data: 4, error: null })
      }
      throw new Error(`unexpected rpc: ${fn}`)
    })
    const answerHistorySelect = vi.fn().mockReturnThis()
    const answerHistoryEq = vi.fn().mockReturnThis()
    const answerHistoryGte = vi.fn().mockReturnThis()
    const answerHistoryNot = vi.fn().mockResolvedValue({ data: [], error: null })

    const from = vi.fn((table: string) => {
      if (table === 'answer_history') {
        return {
          select: answerHistorySelect,
          eq: answerHistoryEq,
          gte: answerHistoryGte,
          not: answerHistoryNot,
        }
      }
      throw new Error(`getProgressProjections should not query table "${table}" directly anymore`)
    })

    mockCreateSupabaseServerClient.mockResolvedValue({ rpc, from })

    const result = await getProgressProjections('user-1')

    expect(rpc).toHaveBeenCalledWith('get_activity_totals')
    expect(rpc).toHaveBeenCalledWith('get_lesson_completion_total')
    expect(answerHistoryGte).toHaveBeenCalled() // bounded window applied
    expect(result.activity).toEqual({ sessions: 3, exercises: 12, durationMs: 45000, activeDays: 2 })
    expect(result.coverage.completed).toBe(4)
  })
})
```

Adjust `mockCreateSupabaseServerClient` to whatever name/import the existing file already uses for the mocked client factory — check Step 1's findings before finalizing this code.

- [ ] **Step 3: Run the test, confirm it fails**

Run: `pnpm test lib/progress/__tests__/queries.test.ts`
Expected: FAIL — `getProgressProjections` still queries `activity_sessions`/`lesson_completions` directly via `.from()`, not `.rpc()`, so the mock's `from` throw fires (or the `rpc` spy is never called).

- [ ] **Step 4: Change projectProgress to accept optional pre-aggregated totals**

Read [lib/progress/projections.ts](../../../lib/progress/projections.ts) in full first (90 lines). Then replace the whole file with:

```ts
import type { EvidenceModality } from '@/lib/practice/attribution'

export type ProgressSignal =
  | 'exposure'
  | 'completion'
  | 'intent'
  | 'objective_evidence'
  | 'transfer'

export interface ProgressFact {
  id: string
  signal: ProgressSignal
  occurredAt: string
  targetId?: string
  correct?: boolean
  exercises?: number
  durationMs?: number
  provenance: string
  modality?: EvidenceModality
}

export interface ProgressProjections {
  activity: {
    sessions: number
    exercises: number
    durationMs: number
    activeDays: number
  }
  coverage: {
    encountered: number
    completed: number
  }
  learning: {
    evidencedTargets: number
    reviewTargets: number
    transferTargets: number
    evidence: Array<Pick<ProgressFact, 'id' | 'targetId' | 'correct' | 'provenance' | 'modality' | 'occurredAt'>>
  }
}

/** Pre-aggregated activity/coverage totals computed in SQL, bypassing the fact-derived walk. */
export interface PrecomputedProjectionTotals {
  activity: {
    sessions: number
    exercises: number
    durationMs: number
    activeDays: number
  }
  /**
   * `encountered` and `completed` collapse to the same count for current callers
   * because getProgressProjections' only coverage-producing signal is `completion`
   * (lesson_completions) — it never emits `exposure` facts. If that changes, this
   * needs a separate `encounteredCount` field.
   */
  completedCount: number
}

/**
 * Pure read-model boundary. Activity and coverage remain visible but cannot
 * raise learning unless the fact carries objective or transfer evidence.
 *
 * When `precomputed` is provided, activity/coverage totals come from it
 * directly (SQL aggregates) and `facts` is expected to contain only
 * evidence-bearing facts (objective_evidence / transfer) — session and
 * completion facts are not needed in that mode. When omitted, activity/
 * coverage are derived from `facts` as before (back-compat for existing
 * callers/tests).
 */
export function projectProgress(
  facts: readonly ProgressFact[],
  precomputed?: PrecomputedProjectionTotals,
): ProgressProjections {
  const activeDays = new Set<string>()
  const covered = new Set<string>()
  const completed = new Set<string>()
  const latestByTarget = new Map<string, ProgressFact>()
  const transferTargets = new Set<string>()
  let sessions = 0
  let exercises = 0
  let durationMs = 0

  for (const fact of facts) {
    if (!precomputed) {
      if (fact.exercises !== undefined || fact.durationMs !== undefined) {
        sessions++
        exercises += fact.exercises ?? 0
        durationMs += fact.durationMs ?? 0
        activeDays.add(fact.occurredAt.slice(0, 10))
      }

      if (fact.signal === 'exposure' || fact.signal === 'completion') covered.add(fact.id)
      if (fact.signal === 'completion') completed.add(fact.id)
    }

    if ((fact.signal === 'objective_evidence' || fact.signal === 'transfer') && fact.targetId) {
      const previous = latestByTarget.get(fact.targetId)
      if (!previous || previous.occurredAt <= fact.occurredAt) latestByTarget.set(fact.targetId, fact)
      if (fact.signal === 'transfer' && fact.correct) transferTargets.add(fact.targetId)
    }
  }

  const evidence = [...latestByTarget.values()]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .map(({ id, targetId, correct, provenance, modality, occurredAt }) => ({
      id, targetId, correct, provenance, modality, occurredAt,
    }))

  return {
    activity: precomputed
      ? precomputed.activity
      : { sessions, exercises, durationMs, activeDays: activeDays.size },
    coverage: precomputed
      ? { encountered: precomputed.completedCount, completed: precomputed.completedCount }
      : { encountered: covered.size, completed: completed.size },
    learning: {
      evidencedTargets: evidence.filter((fact) => fact.correct).length,
      reviewTargets: evidence.filter((fact) => fact.correct === false).length,
      transferTargets: transferTargets.size,
      evidence,
    },
  }
}
```

- [ ] **Step 5: Run the pre-existing projections tests, confirm they still pass unmodified**

Run: `pnpm test lib/progress/__tests__/projections.test.ts`
Expected: PASS — all four existing tests call `projectProgress(facts)` with one argument, exercising the `!precomputed` branch, and must produce output identical to before this change.

- [ ] **Step 6: Rewrite getProgressProjections in queries.ts**

Replace [lib/progress/queries.ts:494-533](../../../lib/progress/queries.ts#L494-L533) (the whole `getProgressProjections` function) with:

```ts
export async function getProgressProjections(userId: string): Promise<ProgressProjections> {
  const supabase = await createSupabaseServerClient()
  const sinceEvidenceWindow = new Date()
  sinceEvidenceWindow.setDate(sinceEvidenceWindow.getDate() - PROGRESS_PROJECTION_EVIDENCE_WINDOW_DAYS)

  const [activityTotals, completionTotal, answers] = await Promise.all([
    supabase.rpc('get_activity_totals'),
    supabase.rpc('get_lesson_completion_total'),
    supabase.from('answer_history')
      .select('id, is_correct, answered_at, exercise_payload')
      .eq('user_id', userId)
      .gte('answered_at', sinceEvidenceWindow.toISOString())
      .not('answered_at', 'is', null),
  ])

  const row = activityTotals.data?.[0] as
    | { sessions: number; exercises: number; duration_ms: number; active_days: number }
    | undefined

  const evidenceFacts = attributedAnswerFacts((answers.data ?? []) as Array<{
    id: string
    is_correct: boolean
    answered_at: string | null
    exercise_payload: unknown
  }>)

  return projectProgress(evidenceFacts, {
    activity: {
      sessions: row?.sessions ?? 0,
      exercises: row?.exercises ?? 0,
      durationMs: row?.duration_ms ?? 0,
      activeDays: row?.active_days ?? 0,
    },
    completedCount: completionTotal.data ?? 0,
  })
}
```

Note: `userId` is still accepted as a parameter (for call-site consistency with every other function in this file) but is no longer used to scope the two RPC calls — those read `auth.uid()` server-side per Task 1. It's still used for the `answer_history` query, which remains a direct table query (not an RPC).

Double-check the import line still works:

Run: `grep -n "from './projections'" lib/progress/queries.ts`
Expected: existing import line unchanged — `projectProgress` and the relevant types were already imported; `PrecomputedProjectionTotals` isn't referenced by name in `queries.ts` (only passed structurally as an object literal), so no import change is needed.

- [ ] **Step 7: Run the new test, confirm it passes**

Run: `pnpm test lib/progress/__tests__/queries.test.ts lib/progress/__tests__/projections.test.ts`
Expected: PASS on all.

- [ ] **Step 8: Full type-check and lint**

Run: `pnpm type-check && pnpm lint`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add lib/progress/queries.ts lib/progress/projections.ts lib/progress/__tests__/queries.test.ts
git commit -m "perf(progress): bound getProgressProjections to SQL aggregates + 180d evidence window"
```

---

## Task 4: Regenerate Supabase types (if this repo checks in generated types)

**Files:**
- Check: `types/supabase.ts` or similar — search first.

- [ ] **Step 1: Check whether generated Supabase types exist in this repo**

Run: `grep -rl "Database" types/ lib/supabase/ 2>/dev/null | head -5` and `find . -maxdepth 2 -iname "*supabase*.d.ts" -o -iname "database.types.ts" 2>/dev/null`

If a generated types file exists and includes RPC function signatures (search it for another existing `rpc(` call target name to confirm the pattern), regenerate it so `supabase.rpc('get_activity_totals')` and `supabase.rpc('get_lesson_completion_total')` are typed instead of falling back to `any`/`unknown`. Use whatever regeneration command the repo already documents — check `package.json` for a `supabase:types` or `gen:types` script first:

Run: `grep -n "types" package.json | grep -i supabase`

- [ ] **Step 2: If a script exists, run it and diff the result**

Run: `pnpm <the script found above>`
Expected: the RPC function names appear in the regenerated file's `Functions` section.

- [ ] **Step 3: Type-check again with the new types in place**

Run: `pnpm type-check`
Expected: no errors. If the manual type annotations added in Task 3 Step 6 (`as { sessions: number; ... }`) now conflict with a stricter generated type, remove the manual cast and let inference take over.

- [ ] **Step 4: Commit (only if types file changed)**

```bash
git add types/supabase.ts  # or whatever path Step 1 found
git commit -m "chore(progress): regenerate supabase types for projection RPCs"
```

If Step 1 found no generated types file in this repo, skip this task entirely — do not create one as a side effect of this plan.

---

## Task 5: Full verification pass

- [ ] **Step 1: Run the complete test suite**

Run: `pnpm test`
Expected: all tests pass, no regressions outside the files touched in this plan.

- [ ] **Step 2: Run the production build**

Run: `pnpm build`
Expected: build succeeds — this exercises the Server Component in [app/(authenticated)/progress/page.tsx](../../../app/(authenticated)/progress/page.tsx) that calls `getProgressPageData` → `getProgressProjections` at request time, not build time, so this step mainly confirms no type errors, not runtime RPC behavior.

- [ ] **Step 3: Manually verify against a real Supabase instance**

Run the dev server (`pnpm dev`), sign in as a user with existing `activity_sessions`/`answer_history`/`lesson_completions` rows, and load `/progress`. Compare the projections shown (sessions count, exercises, active days, evidenced/review targets) against the values from before this change (either via a git stash of the old code run side-by-side, or by manually cross-checking counts in Supabase Studio). Confirm they match.

- [ ] **Step 4: Confirm no CLAUDE.md rules were violated**

- [ ] All Supabase access still goes through `lib/*/queries.ts` (Task 3 didn't add any Supabase call outside `lib/progress/queries.ts`).
- [ ] New RPC functions have RLS-equivalent protection via `auth.uid()` read server-side, not client-supplied (Task 1).
- [ ] No file crossed 250 lines because of this change: `grep -c '' lib/progress/queries.ts lib/progress/projections.ts` and compare to pre-change line counts.

---

## Self-review notes (for whoever executes this)

- **Spec coverage:** addresses the one confirmed-live finding from a pasted code review (`getProgressProjections` unbounded `exercise_payload`/`word_bank`-adjacent/`lesson_completions` fetch). Does **not** touch three other review points that were verified stale/incorrect against the current codebase before this plan was written (recent-sessions limit already fixed in commit `b6e14567`; the "duplicate index" claim is false — different leading columns/purpose; a `performance-after.json` verification-artifact claim couldn't be verified either way against this repo).
- **Known tradeoff, stated explicitly for whoever reviews this PR:** the 180-day evidence window is a real (if narrow) behavior change — a target whose only evidence is older than 180 days will no longer appear in `learning.evidence`. Flag this in the PR description so a human signs off on it, since it's a product-visible change riding on a perf plan.
