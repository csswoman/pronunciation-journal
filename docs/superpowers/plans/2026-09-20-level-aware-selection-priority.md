# Level-Aware Daily Plan Selection Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `selectDailyCandidates`'s reason ranking vary by learner level — an advanced (C1/C2) learner's plan should prioritize `variety` (free production / novel practice) over `word_new` (more new vocabulary drilling), while every other level keeps today's exact ranking. No behavior change for the default case.

**Architecture:** `REASON_PRIORITY` (`lib/practice/daily-plan/policy.ts:7-26`) is today a single flat `Record`. Replace it with a function `reasonPriorityFor(context)` that returns the same flat map by default, and returns a variant map only when `context.learnerLevel` is `'c1'` or `'c2'`. `selectDailyCandidates` takes an optional `context` option (default `{}`) and calls this function once per invocation instead of reading the module-level constant. `composer.ts` passes `{ learnerLevel: activeLevel }` (already computed at composer.ts:107-108 via `getEffectiveLearnerLevel`) at its one call site (composer.ts:256).

**Tech Stack:** TypeScript, Vitest.

**Reference:** `docs/pedagogy-plans/16-adaptive-daily-plan-pacing.md`, Brief C.

---

### Task 1: Extract `reasonPriorityFor` with a default-preserving base case

**Files:**
- Modify: `lib/practice/daily-plan/policy.ts`
- Test: `lib/practice/daily-plan/__tests__/policy.test.ts`

- [x] **Step 1: Write the failing test for parity with today's behavior (no context)**

Add to `lib/practice/daily-plan/__tests__/policy.test.ts`, inside the existing `describe('daily candidate policy', ...)` block, right after the first `it('orders due, weak, route, saved, then variety deterministically', ...)` test:

```ts
  it('orders identically with no learner context (parity check)', () => {
    const selected = selectDailyCandidates([
      step('variety', 'variety'), step('saved', 'saved_intent'), step('route', 'route_next'),
      step('weak', 'weak_target'), step('due', 'due'),
    ], { limit: 5, context: {} })
    expect(selected.map((entry) => entry.id)).toEqual(['due', 'weak', 'route', 'saved', 'variety'])
  })
```

- [x] **Step 2: Run test to verify it currently fails on the new `context` option (compile/shape check)**

Run: `pnpm test -- lib/practice/daily-plan/__tests__/policy.test.ts -t "no learner context"`
Expected: FAIL — `context` is not yet a recognized key of `SelectDailyCandidatesOptions`, so TypeScript will reject it (or, if `tsc` isn't run as part of this test command, the test still passes today because the unknown option is silently ignored — either way, proceed to Step 3 to make `context` real).

- [x] **Step 3: Write the failing test for advanced-level reordering**

Add a new test in the same `describe` block:

```ts
  it('prioritizes variety over new-word drilling for advanced learners (C1/C2)', () => {
    const selected = selectDailyCandidates([
      step('word', 'word_new'), step('variety', 'variety'),
    ], { limit: 2, context: { learnerLevel: 'c1' } })
    expect(selected.map((entry) => entry.id)).toEqual(['variety', 'word'])
  })

  it('keeps the default order for non-advanced levels', () => {
    const selected = selectDailyCandidates([
      step('word', 'word_new'), step('variety', 'variety'),
    ], { limit: 2, context: { learnerLevel: 'a2' } })
    expect(selected.map((entry) => entry.id)).toEqual(['word', 'variety'])
  })
```

- [x] **Step 4: Run tests to verify the new ones fail**

Run: `pnpm test -- lib/practice/daily-plan/__tests__/policy.test.ts -t "advanced learners"`
Expected: FAIL — today's `word_new` (priority 2) always outranks `variety` (priority 5) regardless of level, since level isn't consulted at all yet.

- [x] **Step 5: Implement `reasonPriorityFor` and thread `context` through `selectDailyCandidates`**

Replace the top of `lib/practice/daily-plan/policy.ts` — the flat `REASON_PRIORITY` constant and its surrounding comments — with:

```ts
import type {
  DailySelectionMetadata,
  DailySelectionReason,
  DailyStep,
} from '@/lib/practice/types'
import type { CefrLevelId } from '@/lib/courses/types'

/** Default ranking — unchanged from before this file introduced level-awareness. */
const DEFAULT_REASON_PRIORITY: Record<DailySelectionReason, number> = {
  due: 0,
  verification_due: 0,
  // Preserve one new communicative thread after the genuinely due work. The
  // current builder caps due candidates before this can displace all novelty.
  chunk_new: 1,
  // The grammar slot outranks everything except genuinely due SRS work:
  // its whole purpose is to stop phonetics from silently evicting grammar.
  grammar_slot: 1,
  // New vocabulary is new material, not filler: at 'variety' it sat last and
  // never reached the plan, so the learner only ever saw words they had seen.
  // It ranks BELOW chunk_new deliberately — expressions are the unit we want
  // to grow — so a reserved slot goes to a new chunk whenever one exists.
  word_new: 2,
  recent_error: 2,
  weak_target: 2,
  route_next: 3,
  saved_intent: 4,
  variety: 5,
}

/**
 * C1/C2 learners already have a large receptive vocabulary; drilling more
 * new words at the same priority as due review crowds out the free-form
 * production and novel practice (`variety`) that is actually their growth
 * edge at this stage. Swap the two priorities rather than introducing a
 * third tier, so `variety` competes for word_new's old reserved-adjacent
 * slot instead of sitting last where it never gets picked.
 */
const ADVANCED_REASON_PRIORITY: Record<DailySelectionReason, number> = {
  ...DEFAULT_REASON_PRIORITY,
  word_new: 5,
  variety: 2,
}

const ADVANCED_LEVELS: ReadonlySet<CefrLevelId> = new Set(['c1', 'c2'])

export interface DailyPlanSelectionContext {
  /** Effective learner level (lowercase, matches getEffectiveLearnerLevel's output shape). */
  learnerLevel?: CefrLevelId
}

/**
 * Returns the reason→priority map for this learner. Defaults to
 * DEFAULT_REASON_PRIORITY for every level outside the advanced set, so a
 * caller passing no context (or a non-advanced level) sees byte-identical
 * ranking to the pre-existing flat constant.
 */
export function reasonPriorityFor(
  context: DailyPlanSelectionContext = {},
): Record<DailySelectionReason, number> {
  if (context.learnerLevel && ADVANCED_LEVELS.has(context.learnerLevel)) {
    return ADVANCED_REASON_PRIORITY
  }
  return DEFAULT_REASON_PRIORITY
}
```

Update `SelectDailyCandidatesOptions` (a few lines below) to add the new option:

```ts
export interface SelectDailyCandidatesOptions {
  limit: number
  availableCapabilities?: ReadonlySet<string>
  maxSavedIntent?: number
  reservedChunkNewSlots?: number
  maxDueSteps?: number
  /** Learner context used to adjust reason priority (see reasonPriorityFor). Defaults to {}. */
  context?: DailyPlanSelectionContext
}
```

Finally, inside `selectDailyCandidates`, replace the single line that reads the old module constant:

```ts
  const ranked = candidates
    .map((candidate, index) => ({ ...candidate, index }))
    .sort((a, b) => REASON_PRIORITY[a.selection.reason] - REASON_PRIORITY[b.selection.reason] || a.index - b.index)
```

with:

```ts
  const priority = reasonPriorityFor(options.context)
  const ranked = candidates
    .map((candidate, index) => ({ ...candidate, index }))
    .sort((a, b) => priority[a.selection.reason] - priority[b.selection.reason] || a.index - b.index)
```

Leave every other line of `selectDailyCandidates` (the reservation passes, capability gating, saved/due caps, target dedupe, final re-sort by `rankOf`) untouched — this task only changes which priority table feeds the initial sort.

- [x] **Step 6: Run the policy test suite**

Run: `pnpm test -- lib/practice/daily-plan/__tests__/policy.test.ts`
Expected: PASS — all pre-existing tests (which pass no `context`, so get `DEFAULT_REASON_PRIORITY`) plus the 3 new ones from Steps 1 and 3.

- [x] **Step 7: Run type-check**

Run: `pnpm type-check`
Expected: PASS. If `CefrLevelId` is not exported from `@/lib/courses/types` under that exact name, run `grep -n "CefrLevelId" lib/courses/types.ts` first and use whatever the actual exported name is — `composer.ts:108` already imports it inline as `import('@/lib/courses/types').CefrLevelId`, so the type exists; only the import style may need adjusting.

- [ ] **Step 8: Commit**

```bash
git add lib/practice/daily-plan/policy.ts lib/practice/daily-plan/__tests__/policy.test.ts
git commit -m "feat(daily-plan): level-aware reason priority for advanced learners

REASON_PRIORITY was a single flat ranking for every learner. Extract it
into reasonPriorityFor(context), defaulting to the exact pre-existing
map for every level — byte-identical behavior when no context is
passed. C1/C2 learners get variety (free production, novel practice)
ranked above word_new: at this stage more new-word drilling crowds out
the production practice that's actually their growth edge.

Ref: docs/pedagogy-plans/16-adaptive-daily-plan-pacing.md, Brief C

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Wire learner level from the composer

**Files:**
- Modify: `lib/practice/daily-plan/composer.ts:254-264` (the `selectDailyCandidates` call site)
- Test: `pnpm test` (full suite — this task has no new unit test of its own; it is covered by Task 1's tests plus the existing composer/integration suite)

- [x] **Step 1: Locate the exact call site**

Run: `grep -n "selectDailyCandidates(candidates" lib/practice/daily-plan/composer.ts`
Expected output includes line ~256 (from the version read while writing this plan):

```ts
    selectDailyCandidates(candidates, {
      limit: DAILY_PLAN_STEP_COUNT,
      availableCapabilities: new Set(['network', 'microphone', 'speech_recognition']),
      reservedChunkNewSlots: RESERVED_CHUNK_NEW_SLOTS,
      maxDueSteps: MAX_DUE_STEPS,
    }),
```

If the surrounding lines differ from this (composer.ts has other work landing concurrently), match against the actual current content rather than assuming these line numbers still apply.

- [x] **Step 2: Add the `context` option**

`activeLevel` is already computed earlier in `buildDailyPlan` (composer.ts:107-108: `const activeLevel = learnerLevel.toLowerCase() as import('@/lib/courses/types').CefrLevelId`) and is already in scope at the `selectDailyCandidates` call site. Add one line:

```ts
    selectDailyCandidates(candidates, {
      limit: DAILY_PLAN_STEP_COUNT,
      availableCapabilities: new Set(['network', 'microphone', 'speech_recognition']),
      reservedChunkNewSlots: RESERVED_CHUNK_NEW_SLOTS,
      maxDueSteps: MAX_DUE_STEPS,
      context: { learnerLevel: activeLevel },
    }),
```

Do not change the second `selectDailyCandidates`-adjacent retry loop a few lines below (composer.ts:266-278, the `if (finalSteps.length < targetPracticeCount)` block) — it calls `capPronunciationSteps` directly, not `selectDailyCandidates`, so there is nothing to update there.

- [x] **Step 3: Run the full daily-plan test directory**

Run: `pnpm test -- lib/practice/daily-plan`
Expected: PASS. No existing composer test should assert an exact step order that this changes, since the level-aware reordering only activates for `learnerLevel` values `'c1'`/`'c2'` and only swaps `word_new`/`variety` relative priority — but if a fixture in this directory uses a C1/C2 test user and asserts exact step order, read that failure output and confirm whether the new order is the intended pedagogical outcome (it should be) before adjusting the fixture's expectation.

- [x] **Step 4: Run full type-check and full test suite**

Run: `pnpm type-check && pnpm test`
Expected: both PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/practice/daily-plan/composer.ts
git commit -m "feat(daily-plan): pass learner level into selection priority

Wires the already-resolved activeLevel (getEffectiveLearnerLevel) into
selectDailyCandidates's new context option, so C1/C2 learners actually
get the reordered variety/word_new priority added in the previous
commit. No new data fetch — activeLevel was already computed earlier
in buildDailyPlan for the immersion/grammar steps.

Ref: docs/pedagogy-plans/16-adaptive-daily-plan-pacing.md, Brief C

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Notes / explicitly out of scope

- This plan deliberately ships exactly one adjustment rule (C1/C2 swaps `word_new`/`variety`) rather than a general per-level tuning system, per the pedagogy brief's own scope note ("Definir 1-2 reglas de ajuste iniciales, no todo el espacio de variación"). Adding a rule for anxious/struggling learners (the brief's other mentioned case — more `variety` before forcing `word_new` for low-confidence learners) needs its own signal (e.g. recent accuracy ratio) that does not yet exist as a clean input to this function, and should be its own follow-up plan once that signal is defined.
- `reasonPriorityFor` is exported so it can be unit-tested directly if a future plan wants to test the priority table shape without going through `selectDailyCandidates`'s full selection pipeline.
