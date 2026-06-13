# Plan 002 — Fix heatmap UTC/Lima timezone mismatch

**Written against commit:** `b543c9a`  
**Status:** TODO  
**Effort:** S  
**Priority:** P2  
**Depends on:** 001 (establishes green test baseline)

---

## Why this matters

`getDailyCompletionStats` in `lib/progress/queries.ts` builds the 30-day
activity heatmap using raw UTC date slices. The streak counter in
`lib/daily/streak.ts` uses `toLocalDateString(ts, 'America/Lima')` (UTC-5).

A user who practices at **10 pm Lima time** (= 3 am UTC the next day) will:

- Have **streak count it on the correct Lima day** ✓
- Have **the heatmap credit it to the next UTC day** ✗

The mismatch means the heatmap disagrees with the streak widget on the same
page, and days near midnight appear empty even though the user practiced.

---

## Scope

**In scope:**
- `lib/progress/queries.ts` — `getDailyCompletionStats` function only

**Out of scope:**
- `lib/daily/streak.ts` — already correct, do not touch
- `lib/home/queries.ts` — already uses `toLocalDateString` + `STREAK_TIMEZONE`, do not touch
- Any component files
- Any other function in `lib/progress/queries.ts`

---

## Current state (verified at `b543c9a`)

`lib/progress/queries.ts` lines 88–102:

```ts
const countsByDay = new Map<string, number>()
for (const row of rows) {
  const day = (row.answered_at as string).slice(0, 10)   // ← UTC slice
  countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1)
}

const today = new Date()
// ...
for (let i = 29; i >= 0; i--) {
  const d = new Date(today)
  d.setDate(d.getDate() - i)
  const day = d.toISOString().slice(0, 10)               // ← UTC slice
  const count = countsByDay.get(day) ?? 0
```

Both the bucket keys (from DB timestamps) and the loop labels are UTC.

---

## What to change

### Step 1 — Add the import

At the top of `lib/progress/queries.ts`, add `toLocalDateString` and
`STREAK_TIMEZONE` to the existing import from `@/lib/daily/streak`:

```ts
// Before (line 2):
import { getDailyStreak, type DailyStreakResult } from '@/lib/daily/streak'

// After:
import { getDailyStreak, toLocalDateString, STREAK_TIMEZONE, type DailyStreakResult } from '@/lib/daily/streak'
```

These exports already exist in `lib/daily/streak.ts` (lines 12, 31).

### Step 2 — Fix the bucketing loop

Replace the UTC slice with `toLocalDateString`:

```ts
// Before (lines 88-91):
const countsByDay = new Map<string, number>()
for (const row of rows) {
  const day = (row.answered_at as string).slice(0, 10)
  countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1)
}

// After:
const countsByDay = new Map<string, number>()
for (const row of rows) {
  const day = toLocalDateString(row.answered_at as string, STREAK_TIMEZONE)
  countsByDay.set(day, (countsByDay.get(day) ?? 0) + 1)
}
```

### Step 3 — Fix the label loop

Replace the UTC slice with `toLocalDateString`:

```ts
// Before (lines 100-102):
  const d = new Date(today)
  d.setDate(d.getDate() - i)
  const day = d.toISOString().slice(0, 10)

// After:
  const d = new Date(today)
  d.setDate(d.getDate() - i)
  const day = toLocalDateString(d.toISOString(), STREAK_TIMEZONE)
```

---

## Test plan

The existing test file `lib/daily/__tests__/streak.test.ts` already tests
`toLocalDateString` thoroughly and serves as the model for test style.

Add a new test file: `lib/progress/__tests__/getDailyCompletionStats.test.ts`

The new tests must cover the timezone boundary case — answering just before
midnight Lima time (= early hours UTC next day) must land in the Lima day, not
the UTC day. Use the same helper pattern as `streak.test.ts`:

```ts
// lib/progress/__tests__/getDailyCompletionStats.test.ts
import { describe, it, expect } from 'vitest'

// Pure helper extracted from getDailyCompletionStats — see note below.
// Tests verify that bucketing uses Lima timezone, not UTC.

const LIMA_TZ = 'America/Lima'

// 2026-06-10 at 23:30 Lima (UTC-5) = 2026-06-11T04:30:00Z
// Must bucket to '2026-06-10', not '2026-06-11'.
const LATE_NIGHT_LIMA = '2026-06-11T04:30:00Z'

describe('heatmap timezone bucketing', () => {
  it('buckets a 23:30 Lima answer to the Lima calendar day', () => {
    const { toLocalDateString } = require('@/lib/daily/streak')
    expect(toLocalDateString(LATE_NIGHT_LIMA, LIMA_TZ)).toBe('2026-06-10')
  })
})
```

**Note on testability:** `getDailyCompletionStats` is not exported. If the
executor wants deeper coverage, they may extract the pure bucketing and loop
logic into a `buildHeatmap(rows, nowIso, timeZone)` helper function and export
it for testing. This is optional — the change is already tested transitively
through `toLocalDateString`'s existing test suite, which is comprehensive.

---

## Verification commands

Run these in the repo root in order. Each must pass before moving to the next.

```bash
# 1. Type check — must exit 0
pnpm type-check

# 2. Lint — must exit 0
pnpm lint

# 3. Unit tests — must show 0 failed (268+ tests)
pnpm test

# 4. Design tokens — must print "No design token violations found."
pnpm lint:design-tokens
```

---

## Done criteria (machine-checkable)

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` shows 0 failed tests; count ≥ 268
- [ ] `git diff --name-only HEAD` shows changes only in `lib/progress/queries.ts` and optionally `lib/progress/__tests__/getDailyCompletionStats.test.ts`
- [ ] `grep "\.slice(0, 10)" lib/progress/queries.ts` returns 0 matches
- [ ] `grep "toLocalDateString" lib/progress/queries.ts` returns exactly 2 matches (one per loop)

---

## STOP conditions

- If `getDailyCompletionStats` was refactored since `b543c9a` and the function
  signature or loop structure is significantly different, STOP and report the
  current state rather than applying the patch blindly.
- If `toLocalDateString` or `STREAK_TIMEZONE` no longer exist in
  `lib/daily/streak.ts`, STOP.
- If any verification step fails after your changes, STOP and report the exact
  error — do not improvise fixes outside the declared scope.

---

## Maintenance note

Any future query in `lib/progress/queries.ts` or `lib/home/queries.ts` that
builds calendar-day buckets from `answered_at` timestamps must use
`toLocalDateString(ts, STREAK_TIMEZONE)` — never `.toISOString().slice(0, 10)`
or `.slice(0, 10)` directly on a DB timestamp string.

The correct pattern is already established in `lib/home/queries.ts`
`getTodayPracticeGoal` (lines 37-55) — follow that as the exemplar.
