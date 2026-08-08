# Essential Words Home Stats Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `/practice/essential-words` pre-session screen so "Racha" reflects **any** qualifying app activity (daily checklist, practice sessions, reading lessons — not just word-level answers), "Mañana" shows reviews actually due tomorrow (not today's due count), and users who already completed today's daily quota see a clear "ya lo hiciste, sigue aprendiendo" indicator instead of a hero that looks like nothing happened yet. This also fixes the same streak displayed on `/` (home) and `/progress`, since they share the same underlying `getDailyStreak()` — today it only counts `answer_history` rows, so completing a reading lesson or a non-word-answer practice session doesn't move the streak anywhere in the app.

**Architecture:**
- **Streak source (app-wide fix, not essential-words-only):** `getDailyStreak()` in `lib/daily/streak.ts` currently queries only `answer_history.answered_at`. Expand it to also pull `activity_sessions.completed_at` (written by `recordActivitySession` for practice sessions, reader completions, phoneme practice, AI coach, daily-checklist ticks — see `lib/progress/activity-hub.ts`) and `lesson_completions.completed_at` (reading lessons). Merge all three timestamp sources and pass `threshold: 1` to the existing `computeStreakFromTimestamps(timestamps, now, timeZone, threshold)` — that function already accepts a threshold param, so **no changes to the pure `streak-core.ts` logic or its existing tests are needed**. This one query-layer change automatically fixes the streak everywhere it's shown: home page header, `/progress`, and (once wired) essential-words.
- Then: stop reading the stale/parallel `db.userStats.currentStreak` (Dexie, written by `updateUserStats` but never reconciled with the real streak system) in essential-words. Fetch the now-corrected streak server-side in `app/(authenticated)/practice/essential-words/page.tsx` via `getDailyStreak()` (same function the home page and `/progress` already use), and thread it down as a prop: `page.tsx` → `EssentialWordsSession` → `SessionReady` → `SessionReadyInsights`. This matches the exact pattern `app/(authenticated)/page.tsx` already uses for its own streak card, so no new API route is needed and offline mode is unaffected (prop is just undefined/stale on repeat client navigations, same as other server-fetched home props).
- Mañana: add a pure helper `countDueByDate` in a new `lib/essential-words/due-tomorrow.ts` module that counts `SRSData` entries whose `nextReview` falls on tomorrow's local date, and use it instead of reusing today's `dueCount`.
- Already-completed-today indicator: add a pure helper `isDailyQuotaMet(stats)` and render a small inline banner in `SessionReadyHero` when true, distinct from the full `SessionDone`/`wasEmpty` screen (which only fires when the queue is fully empty).

**Note on `getDailyCompletionStats` (the `/progress` 30-day heatmap):** it also currently queries `answer_history` only (`lib/progress/queries.ts`). This plan does NOT change it — it's a separate function with its own `DAILY_STREAK_THRESHOLD` (5) semantics for heat-level shading, not a pass/fail streak day. Broadening it is out of scope here; flag it to the user as a known follow-up if they later notice the heatmap disagreeing with the (now-broadened) streak count.

**Tech Stack:** Next.js 16 App Router (Server Components), React 19, TypeScript, Dexie.js, Vitest.

---

## File Structure

- Modify: `lib/daily/streak.ts` — merge `answer_history` + `activity_sessions` + `lesson_completions` timestamps, call `computeStreakFromTimestamps` with `threshold: 1`.
- Modify: `lib/daily/__tests__/streak.test.ts` (or create `lib/daily/__tests__/streak.integration.test.ts` if the existing file only tests `streak-core.ts` — check first) — cover the merged-source, threshold-1 behavior.
- Modify: `app/(authenticated)/practice/essential-words/page.tsx` — fetch `getDailyStreak` server-side, pass as prop.
- Modify: `components/practice/essential-words/EssentialWordsSession.tsx` — accept `initialStreak` prop, thread to `SessionReady`.
- Modify: `components/practice/essential-words/SessionReady.tsx` — accept `streak` prop, thread to `SessionReadyInsights`.
- Modify: `components/practice/essential-words/SessionReadyInsights.tsx` — drop Dexie `userStats` read; accept `streak` prop; use new `dueTomorrowCount` helper for "Mañana" instead of `stats.dueCount`.
- Create: `lib/essential-words/due-tomorrow.ts` — pure `countDueTomorrow(entries, now)` helper + Dexie-backed `getEssentialWordsDueTomorrowCount(userId)`.
- Create: `lib/essential-words/__tests__/due-tomorrow.test.ts`.
- Modify: `lib/essential-words/session-loader.ts` — call the new Dexie helper and add `dueTomorrow` to `EssentialWordsStats`.
- Modify: `hooks/useEssentialWordsSession.ts` — no signature change needed (stats already flows through), but verify `EssentialWordsStats` re-export picks up the new field (it does automatically via `export type { EssentialWordsStats } from ".../session-loader"`).
- Create: `lib/essential-words/daily-quota.ts` — pure `isDailyQuotaMet(stats)` helper.
- Create: `lib/essential-words/__tests__/daily-quota.test.ts`.
- Modify: `components/practice/essential-words/SessionReadyHero.tsx` — render "Ya completaste tu diaria de hoy" banner when `isDailyQuotaMet(stats)` is true; requires adding `stats` to its props.
- Modify: `components/practice/essential-words/__tests__/SessionReadyHero.test.tsx` — cover the new banner.
- Modify: `components/practice/essential-words/SessionReady.tsx` — pass `stats` into `SessionReadyHero` (it already receives `stats` as a prop, just not forwarded to Hero today).

---

## Task 0: Expand streak to count any qualifying activity, not just word answers

**Files:**
- Modify: `lib/daily/streak.ts`
- Test: `lib/daily/__tests__/streak.test.ts` — check its current scope first (Step 1)

- [ ] **Step 1: Read the current test file to see what it covers**

Run: Read `lib/daily/__tests__/streak.test.ts` (already shown in this plan's research — it tests `computeStreakFromTimestamps` and `toLocalDateString` from `streak-core.ts` only; `getDailyStreak` itself, the Supabase-querying function in `streak.ts`, has no existing test). This task adds a **new** test file for `streak.ts` since it needs to mock the Supabase client — don't touch `streak-core.test.ts` coverage, it stays green untouched.

- [ ] **Step 2: Write the failing test**

Follow the exact thenable-chain-builder mocking idiom already used in `lib/home/__tests__/placement-state.test.ts` (keyed-by-table-name builder, `then()` resolves the final result) rather than inventing a new mock shape:

```typescript
// lib/daily/__tests__/streak.test.ts (append to the existing file)
import { beforeEach, describe, it, expect, vi } from 'vitest'

const results = vi.hoisted(() => new Map<string, { data: Array<Record<string, unknown>>; error: null }>())

function builder(result: { data: Array<Record<string, unknown>>; error: null }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    not: () => chain,
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  }
  return chain
}

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => builder(results.get(table) ?? { data: [], error: null }),
  }),
}))

import { getDailyStreak } from '../streak'

describe('getDailyStreak — merges activity sources', () => {
  beforeEach(() => {
    results.clear()
  })

  it('counts a day with only one lesson_completions row (no answer_history) as qualifying', async () => {
    const today = new Date().toISOString()
    results.set('lesson_completions', { data: [{ completed_at: today }], error: null })

    const result = await getDailyStreak('user-1')
    expect(result.completedToday).toBe(true)
    expect(result.currentStreak).toBe(1)
  })

  it('counts a day with only one activity_sessions row as qualifying', async () => {
    const today = new Date().toISOString()
    results.set('activity_sessions', { data: [{ completed_at: today }], error: null })

    const result = await getDailyStreak('user-1')
    expect(result.completedToday).toBe(true)
  })

  it('still counts a day with only answer_history rows (backward compatible)', async () => {
    const today = new Date().toISOString()
    results.set('answer_history', { data: [{ answered_at: today }], error: null })

    const result = await getDailyStreak('user-1')
    expect(result.completedToday).toBe(true)
  })

  it('returns no streak when all three sources are empty', async () => {
    const result = await getDailyStreak('user-1')
    expect(result.completedToday).toBe(false)
    expect(result.currentStreak).toBe(0)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test lib/daily/__tests__/streak.test.ts`
Expected: FAIL — `getDailyStreak` doesn't query `activity_sessions`/`lesson_completions` yet, so `completedToday` is `false` for the lesson/activity-only cases

- [ ] **Step 4: Implement**

```typescript
// lib/daily/streak.ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { computeStreakFromTimestamps, type DailyStreakResult } from './streak-core'
export type { DailyStreakResult } from './streak-core'

/**
 * A day "counts" toward the streak if the user did ANY qualifying activity —
 * answered a word, completed a practice session, or finished a reading
 * lesson. Unlike the old answer-only streak, this is intentionally a
 * threshold-of-1 check (see computeStreakFromTimestamps's `threshold` param):
 * one qualifying event is enough, we don't require 5 of them once other
 * activity types are in the mix.
 */
const ANY_ACTIVITY_THRESHOLD = 1

// ── Supabase query ────────────────────────────────────────────────────────────

/**
 * Server-only: fetch timestamps from every activity source that should count
 * toward the daily streak, and compute the user's streak from the union.
 */
export async function getDailyStreak(userId: string): Promise<DailyStreakResult> {
  const supabase = await createSupabaseServerClient()

  const [answerHistory, activitySessions, lessonCompletions] = await Promise.all([
    supabase
      .from('answer_history')
      .select('answered_at')
      .eq('user_id', userId)
      .not('answered_at', 'is', null),
    supabase
      .from('activity_sessions')
      .select('completed_at')
      .eq('user_id', userId),
    supabase
      .from('lesson_completions')
      .select('completed_at')
      .eq('user_id', userId),
  ])

  if (answerHistory.error) throw answerHistory.error
  if (activitySessions.error) throw activitySessions.error
  if (lessonCompletions.error) throw lessonCompletions.error

  const timestamps = [
    ...(answerHistory.data ?? []).map((r) => r.answered_at as string),
    ...(activitySessions.data ?? []).map((r) => r.completed_at as string),
    ...(lessonCompletions.data ?? []).map((r) => r.completed_at as string),
  ].filter(Boolean)

  return computeStreakFromTimestamps(
    timestamps,
    new Date().toISOString(),
    undefined,
    ANY_ACTIVITY_THRESHOLD,
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test lib/daily/__tests__/streak.test.ts`
Expected: PASS — including all pre-existing `streak-core.ts` tests in the same file (unaffected, since `streak-core.ts` itself wasn't touched)

- [ ] **Step 6: Run the callers' tests to check for regressions**

Run: `pnpm test lib/progress` and `pnpm test app` (or targeted: any test file that renders the home page or `/progress` and asserts on streak numbers). `getDailyCompletionStats`/`getAccuracyStats` are untouched (per the plan header note), so this should be a clean pass — if something asserts `getDailyStreak` requires 5 answer_history rows specifically, update that fixture to reflect the new any-activity-counts behavior instead of reverting the fix.

- [ ] **Step 7: Type-check**

Run: `pnpm type-check`
Expected: no new errors

- [ ] **Step 8: Commit**

```bash
git add lib/daily/streak.ts lib/daily/__tests__/streak.test.ts
git commit -m "feat(daily): count any qualifying activity toward the streak, not just word answers

getDailyStreak previously only queried answer_history, so completing a
reading lesson, a daily checklist item, or any non-word-answer practice
session (AI coach, phoneme practice, reader) never moved the streak show
on home / /progress / essential-words. Now merges answer_history +
activity_sessions + lesson_completions timestamps and uses a
threshold-of-1 day-qualifies rule (computeStreakFromTimestamps already
supported a configurable threshold — streak-core.ts itself is unchanged).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 1: `countDueTomorrow` pure helper + test

**Files:**
- Create: `lib/essential-words/due-tomorrow.ts`
- Test: `lib/essential-words/__tests__/due-tomorrow.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/essential-words/__tests__/due-tomorrow.test.ts
import { describe, expect, it } from "vitest";
import { countDueTomorrow } from "../due-tomorrow";
import type { SRSData } from "@/lib/types";

function entry(nextReview: string): SRSData {
  return {
    wordId: "essential-words:test",
    word: "test",
    ease: 2.5,
    interval: 1,
    repetitions: 1,
    nextReview,
  };
}

describe("countDueTomorrow", () => {
  it("counts entries whose nextReview falls on tomorrow's local date", () => {
    const now = new Date("2026-08-06T10:00:00.000Z");
    const entries = [
      entry("2026-08-07T03:00:00.000Z"), // tomorrow
      entry("2026-08-07T23:00:00.000Z"), // tomorrow
      entry("2026-08-06T23:00:00.000Z"), // today
      entry("2026-08-08T03:00:00.000Z"), // day after tomorrow
    ];
    expect(countDueTomorrow(entries, now)).toBe(2);
  });

  it("returns 0 when nothing is due tomorrow", () => {
    const now = new Date("2026-08-06T10:00:00.000Z");
    expect(countDueTomorrow([entry("2026-08-06T23:00:00.000Z")], now)).toBe(0);
  });

  it("ignores overdue entries (nextReview in the past)", () => {
    const now = new Date("2026-08-06T10:00:00.000Z");
    expect(countDueTomorrow([entry("2026-08-01T03:00:00.000Z")], now)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/essential-words/__tests__/due-tomorrow.test.ts`
Expected: FAIL — cannot find module `../due-tomorrow`

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/essential-words/due-tomorrow.ts
import type { SRSData } from "@/lib/types";
import { db } from "@/lib/db";
import { ESSENTIAL_WORD_PREFIX } from "./types";

/** YYYY-MM-DD in the local timezone of `d`. Local, not UTC, so "tomorrow" matches the user's day. */
function localDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Pure: count SRS entries due exactly on the calendar day after `now`. */
export function countDueTomorrow(entries: SRSData[], now: Date): number {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = localDateKey(tomorrow);

  return entries.filter((entry) => {
    const reviewDate = new Date(entry.nextReview);
    return localDateKey(reviewDate) === tomorrowKey;
  }).length;
}

/** Dexie-backed: reviews scheduled for tomorrow across the user's Essential Words deck. */
export async function getEssentialWordsDueTomorrowCount(userId?: string): Promise<number> {
  if (!userId) return 0;
  const entries = await db.srsData
    .filter((e) => e.userId === userId && e.wordId.startsWith(ESSENTIAL_WORD_PREFIX))
    .toArray();
  return countDueTomorrow(entries, new Date());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/essential-words/__tests__/due-tomorrow.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/essential-words/due-tomorrow.ts lib/essential-words/__tests__/due-tomorrow.test.ts
git commit -m "feat(essential-words): add countDueTomorrow helper for accurate 'Mañana' stat

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: Wire `dueTomorrow` into `EssentialWordsStats` and the loader

**Files:**
- Modify: `lib/essential-words/session-loader.ts`
- Test: `lib/essential-words/__tests__/session-loader.test.ts` (create if it doesn't exist — check first with Glob)

- [ ] **Step 1: Check for an existing loader test file**

Run: `ls lib/essential-words/__tests__/ | grep session-loader` (or Glob `lib/essential-words/__tests__/session-loader*`)

If none exists, skip to Step 3 (this loader is thin glue over already-tested pieces; add a focused test only for the new field).

- [ ] **Step 2: Write the failing test for the new stats field**

```typescript
// lib/essential-words/__tests__/session-loader.test.ts (append or create)
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/essential-words/client", () => ({
  fetchEssentialWords: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/db", () => ({
  getEssentialWordsIntroducedToday: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/essential-words/prepare-srs", () => ({
  prepareEssentialWordsSrsEntries: vi.fn().mockResolvedValue({ entries: [], activatedWordIds: [] }),
}));
vi.mock("@/lib/essential-words/due-tomorrow", () => ({
  getEssentialWordsDueTomorrowCount: vi.fn().mockResolvedValue(3),
}));

import { loadEssentialWordsQueue } from "../session-loader";

describe("loadEssentialWordsQueue stats.dueTomorrow", () => {
  it("surfaces the dueTomorrow count from getEssentialWordsDueTomorrowCount", async () => {
    const result = await loadEssentialWordsQueue(null, null, "user-1");
    expect(result.stats.dueTomorrow).toBe(3);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test lib/essential-words/__tests__/session-loader.test.ts`
Expected: FAIL — `stats.dueTomorrow` is `undefined`, or type error `dueTomorrow does not exist`

- [ ] **Step 4: Implement — add the field**

In `lib/essential-words/session-loader.ts`:

```typescript
import { fetchEssentialWords } from "@/lib/essential-words/client";
import { buildSessionQueue, matchesFilter, type EssentialWordQueueItem } from "@/lib/essential-words/queue";
import { essentialWordId, NEW_CARDS_PER_DAY, type CefrLevel, type EssentialWordPos, type EssentialWord } from "@/lib/essential-words/types";
import { getEssentialWordsIntroducedToday } from "@/lib/db";
import { prepareEssentialWordsSrsEntries } from "@/lib/essential-words/prepare-srs";
import { getEssentialWordsDueTomorrowCount } from "@/lib/essential-words/due-tomorrow";
import { phaseForEssentialWordItem, type EssentialWordsPhase } from "@/lib/essential-words/session-model";
import { isVaultEntry } from "@/lib/srs/vault";

export interface EssentialWordsStats {
  totalWords: number;
  learned: number;
  dueCount: number;
  /** Reviews scheduled for the calendar day after today (not today's due count). */
  dueTomorrow: number;
  newToday: number;
  newQuota: number;
  vaulted: number;
}
```

Then in `loadEssentialWordsQueue`, fetch it alongside the existing parallel fetches and include it in the returned `stats`:

```typescript
  const [words, introducedToday, dueTomorrow] = await Promise.all([
    fetchEssentialWords(),
    getEssentialWordsIntroducedToday(userId),
    getEssentialWordsDueTomorrowCount(userId),
  ]);
```

```typescript
    stats: {
      totalWords: scopedWords.length,
      learned,
      dueCount: items.filter((item) => item.kind === "review").length,
      dueTomorrow,
      newToday: introducedToday.length,
      newQuota: NEW_CARDS_PER_DAY,
      vaulted: srsEntries.filter(isVaultEntry).length,
    },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test lib/essential-words/__tests__/session-loader.test.ts`
Expected: PASS

- [ ] **Step 6: Run the full essential-words test suite to catch stats-shape regressions**

Run: `pnpm test lib/essential-words`
Expected: PASS — if any test constructs `EssentialWordsStats` literals without `dueTomorrow`, add `dueTomorrow: 0` to that fixture.

- [ ] **Step 7: Commit**

```bash
git add lib/essential-words/session-loader.ts lib/essential-words/__tests__/session-loader.test.ts
git commit -m "feat(essential-words): add dueTomorrow to EssentialWordsStats

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Fix "Mañana" label in `SessionReadyInsights` to use `dueTomorrow`

**Files:**
- Modify: `components/practice/essential-words/SessionReadyInsights.tsx`
- Test: `components/practice/essential-words/__tests__/SessionReadyInsights.test.tsx` (create — none currently exists per repo scan)

- [ ] **Step 1: Write the failing test**

```tsx
// components/practice/essential-words/__tests__/SessionReadyInsights.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: () => undefined,
}));
vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

import { SessionReadyInsights } from "../SessionReadyInsights";
import type { EssentialWordsStats } from "@/hooks/useEssentialWordsSession";

const baseStats: EssentialWordsStats = {
  totalWords: 740, learned: 10, dueCount: 20, dueTomorrow: 4,
  newToday: 0, newQuota: 10, vaulted: 0,
};

describe("SessionReadyInsights", () => {
  it("shows dueTomorrow (not dueCount) under Mañana", () => {
    render(<SessionReadyInsights stats={baseStats} streak={0} />);
    expect(screen.getByText("4 repasos")).toBeInTheDocument();
    expect(screen.queryByText("20 repasos")).not.toBeInTheDocument();
  });

  it("renders the streak prop instead of reading Dexie userStats", () => {
    render(<SessionReadyInsights stats={baseStats} streak={5} />);
    expect(screen.getByText("5 días")).toBeInTheDocument();
  });

  it("singularizes 1 repaso / 1 día", () => {
    render(<SessionReadyInsights stats={{ ...baseStats, dueTomorrow: 1 }} streak={1} />);
    expect(screen.getByText("1 repaso")).toBeInTheDocument();
    expect(screen.getByText("1 día")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test components/practice/essential-words/__tests__/SessionReadyInsights.test.tsx`
Expected: FAIL — `streak` prop doesn't exist yet; component still reads `useLiveQuery`/`db.userStats` and uses `stats.dueCount`

- [ ] **Step 3: Implement**

```tsx
// components/practice/essential-words/SessionReadyInsights.tsx
'use client'

// Planned structure:
// <SessionReadyInsights>
//   <InsightCard label="Racha" />
//   <InsightCard label="Mañana" />
// </SessionReadyInsights>

import type { EssentialWordsStats } from '@/hooks/useEssentialWordsSession'
import { SessionSurface } from './session-chrome'

interface Props {
  stats: EssentialWordsStats
  /** Real app-wide streak (Supabase-backed), fetched server-side and passed down. */
  streak: number
}

function InsightCard({ label, value }: { label: string; value: string }) {
  return (
    <SessionSurface className="gap-1 py-4">
      <span className="font-kicker text-fg-subtle">{label}</span>
      <span className="type-stat text-h3 tracking-tight text-fg">{value}</span>
    </SessionSurface>
  )
}

export function SessionReadyInsights({ stats, streak }: Props) {
  const streakLabel = `${streak} ${streak === 1 ? 'día' : 'días'}`
  const tomorrowLabel = `${stats.dueTomorrow} ${stats.dueTomorrow === 1 ? 'repaso' : 'repasos'}`

  return (
    <div className="grid grid-cols-2 gap-layout-stack">
      <InsightCard label="Racha" value={streakLabel} />
      <InsightCard label="Mañana" value={tomorrowLabel} />
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test components/practice/essential-words/__tests__/SessionReadyInsights.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add components/practice/essential-words/SessionReadyInsights.tsx components/practice/essential-words/__tests__/SessionReadyInsights.test.tsx
git commit -m "fix(essential-words): Mañana card shows reviews due tomorrow, streak comes from real source

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: Thread real streak down from the server page

**Files:**
- Modify: `app/(authenticated)/practice/essential-words/page.tsx`
- Modify: `components/practice/essential-words/EssentialWordsSession.tsx`
- Modify: `components/practice/essential-words/SessionReady.tsx`
- Test: `components/practice/essential-words/__tests__/SessionReady.test.tsx` (check if exists first)

- [ ] **Step 1: Check for existing SessionReady tests**

Run: Glob `components/practice/essential-words/__tests__/SessionReady.test.tsx`. If present, read it to match existing conventions before editing.

- [ ] **Step 2: Update `SessionReady` to accept and forward `streak`**

```typescript
// components/practice/essential-words/SessionReady.tsx
'use client'

// Planned structure:
// <SessionReady>
//   <SessionReadyHero />
//   <SessionReadyLevelProgress />
//   <SessionReadyInsights />
//   <SessionReadyVaultRow />
// </SessionReady>

import type { EssentialWordsCounts, EssentialWordsStats } from '@/hooks/useEssentialWordsSession'
import { SessionReadyHero } from './SessionReadyHero'
import { SessionReadyInsights } from './SessionReadyInsights'
import { SessionReadyLevelProgress } from './SessionReadyLevelProgress'
import { SessionReadyVaultRow } from './SessionReadyVaultRow'

interface Props {
  counts: EssentialWordsCounts
  stats: EssentialWordsStats
  streak: number
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
  onBegin: () => void
}

export function SessionReady({
  counts,
  stats,
  streak,
  activeRouteId,
  onRouteChange,
  onBegin,
}: Props) {
  const isResume = counts.learningRemaining > 0

  return (
    <section
      aria-labelledby="session-ready-title"
      className="flex w-full flex-col gap-layout-stack animate-message-in"
    >
      <SessionReadyHero
        counts={counts}
        stats={stats}
        isResume={isResume}
        activeRouteId={activeRouteId}
        onRouteChange={onRouteChange}
        onBegin={onBegin}
      />
      <SessionReadyLevelProgress />
      <SessionReadyInsights stats={stats} streak={streak} />
      <SessionReadyVaultRow />
    </section>
  )
}
```

(Note: `stats` is now also passed to `SessionReadyHero` — needed for Task 5. If Task 5 is done separately, this line is still correct to add now since `SessionReadyHero`'s props aren't finalized until Task 5, but adding the pass-through here is harmless and keeps this task self-contained for the streak wiring.)

- [ ] **Step 3: Update `EssentialWordsSession` to accept `initialStreak` and forward it**

In `components/practice/essential-words/EssentialWordsSession.tsx`, add a prop and pass it to `SessionReady`:

```typescript
export function EssentialWordsSession({ initialStreak = 0 }: { initialStreak?: number }) {
```

Find the `phase === 'ready'` block (currently ~line 177-194) and add `streak={initialStreak}`:

```tsx
  if (phase === 'ready') {
    return (
      <>
        <SessionShell className="min-h-[calc(100dvh-10rem)] sm:min-h-[calc(100dvh-8rem)]">
          {pageHeader}
          {sessionToolbar}
          <SessionReady
            counts={counts}
            stats={stats}
            streak={initialStreak}
            activeRouteId={activeRouteId}
            onRouteChange={(id) => void setRoute(id)}
            onBegin={beginSession}
          />
        </SessionShell>
        {exitSheet}
      </>
    )
  }
```

- [ ] **Step 4: Fetch streak server-side in the page and pass it down**

```typescript
// app/(authenticated)/practice/essential-words/page.tsx
import PageLayout from '@/components/layout/PageLayout'
import { EssentialWordsSession } from '@/components/practice/essential-words/EssentialWordsSession'
import { getSupabaseServerUserId } from '@/lib/supabase/session'
import { getDailyStreak } from '@/lib/daily/streak'

export const metadata = { title: 'Palabras esenciales' }

export default async function EssentialWordsPage() {
  const userId = await getSupabaseServerUserId()
  const streak = userId
    ? await getDailyStreak(userId).then((r) => r.currentStreak).catch(() => 0)
    : 0

  return (
    <PageLayout
      archetype="session"
      className="pt-space-8! pb-[calc(var(--layout-page-block-end)+var(--space-12))]! sm:pt-space-10! sm:pb-layout-page-block-end!"
    >
      <EssentialWordsSession initialStreak={streak} />
    </PageLayout>
  )
}
```

- [ ] **Step 5: Verify `getSupabaseServerUserId` import path**

Run: `grep -r "export.*getSupabaseServerUserId" lib/supabase/` to confirm the exact export name/path used elsewhere (it's already imported this way in `app/(authenticated)/page.tsx:5`, so this should match exactly).

- [ ] **Step 6: Update any test that renders `SessionReady` or `EssentialWordsSession` directly**

Run: `pnpm test components/practice/essential-words` — fix any test that constructs `<SessionReady>` without a `streak` prop (add `streak={0}`), or mocks `SessionReadyInsights`/`SessionReadyHero` and asserts on their old prop shape.

- [ ] **Step 7: Type-check**

Run: `pnpm type-check`
Expected: no new errors related to `streak`/`initialStreak`/`stats` props.

- [ ] **Step 8: Commit**

```bash
git add app/\(authenticated\)/practice/essential-words/page.tsx components/practice/essential-words/EssentialWordsSession.tsx components/practice/essential-words/SessionReady.tsx
git commit -m "fix(essential-words): fetch real streak server-side and thread it to SessionReady

Unifies Essential Words' Racha stat with the same getDailyStreak() source
used by the home page and /progress, instead of a stale parallel Dexie
counter (db.userStats.currentStreak) that nothing kept in sync.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: "Ya completaste tu diaria de hoy" indicator

**Files:**
- Create: `lib/essential-words/daily-quota.ts`
- Create: `lib/essential-words/__tests__/daily-quota.test.ts`
- Modify: `components/practice/essential-words/SessionReadyHero.tsx`
- Modify: `components/practice/essential-words/__tests__/SessionReadyHero.test.tsx`

- [ ] **Step 1: Write the failing test for the pure helper**

```typescript
// lib/essential-words/__tests__/daily-quota.test.ts
import { describe, expect, it } from "vitest";
import { isDailyQuotaMet } from "../daily-quota";
import type { EssentialWordsStats } from "@/hooks/useEssentialWordsSession";

function stats(overrides: Partial<EssentialWordsStats>): EssentialWordsStats {
  return {
    totalWords: 740, learned: 10, dueCount: 0, dueTomorrow: 0,
    newToday: 0, newQuota: 10, vaulted: 0,
    ...overrides,
  };
}

describe("isDailyQuotaMet", () => {
  it("is true once today's new-word quota is filled and nothing is due today", () => {
    expect(isDailyQuotaMet(stats({ newToday: 10, newQuota: 10, dueCount: 0 }))).toBe(true);
  });

  it("is false while reviews are still due today, even if new quota is met", () => {
    expect(isDailyQuotaMet(stats({ newToday: 10, newQuota: 10, dueCount: 3 }))).toBe(false);
  });

  it("is false while the new-word quota isn't filled yet", () => {
    expect(isDailyQuotaMet(stats({ newToday: 4, newQuota: 10, dueCount: 0 }))).toBe(false);
  });

  it("is true when newQuota is 0 (no new words configured) and nothing is due", () => {
    expect(isDailyQuotaMet(stats({ newToday: 0, newQuota: 0, dueCount: 0 }))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test lib/essential-words/__tests__/daily-quota.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement**

```typescript
// lib/essential-words/daily-quota.ts
import type { EssentialWordsStats } from "@/hooks/useEssentialWordsSession";

/**
 * True once the learner has hit today's new-word quota and has no reviews
 * left due today. Used to show a "you're done for today, keep going if you
 * want" banner on the ready screen instead of repeating "Hoy te tocan N".
 */
export function isDailyQuotaMet(stats: EssentialWordsStats): boolean {
  return stats.newToday >= stats.newQuota && stats.dueCount === 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test lib/essential-words/__tests__/daily-quota.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit the helper**

```bash
git add lib/essential-words/daily-quota.ts lib/essential-words/__tests__/daily-quota.test.ts
git commit -m "feat(essential-words): add isDailyQuotaMet helper

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Write the failing test for the banner in `SessionReadyHero`**

Read `components/practice/essential-words/__tests__/SessionReadyHero.test.tsx` first (Read tool) to match its existing render helpers/fixtures exactly, then append:

```tsx
// Add to components/practice/essential-words/__tests__/SessionReadyHero.test.tsx
it("shows the daily-quota-met banner when today's quota is filled and nothing is due", () => {
  render(
    <SessionReadyHero
      counts={{ newRemaining: 0, learningRemaining: 0, reviewRemaining: 5 }}
      stats={{ totalWords: 740, learned: 10, dueCount: 0, dueTomorrow: 2, newToday: 10, newQuota: 10, vaulted: 0 }}
      isResume={false}
      activeRouteId={null}
      onRouteChange={() => {}}
      onBegin={() => {}}
    />
  )
  expect(screen.getByText(/ya completaste tu diaria de hoy/i)).toBeInTheDocument()
})

it("does not show the banner while reviews are still due today", () => {
  render(
    <SessionReadyHero
      counts={{ newRemaining: 0, learningRemaining: 0, reviewRemaining: 5 }}
      stats={{ totalWords: 740, learned: 10, dueCount: 3, dueTomorrow: 2, newToday: 10, newQuota: 10, vaulted: 0 }}
      isResume={false}
      activeRouteId={null}
      onRouteChange={() => {}}
      onBegin={() => {}}
    />
  )
  expect(screen.queryByText(/ya completaste tu diaria de hoy/i)).not.toBeInTheDocument()
})
```

Adjust the exact import list / render wrapper to match whatever the existing test file already uses (it may wrap in a router/auth provider — mirror the existing tests, don't invent a new setup).

- [ ] **Step 7: Run test to verify it fails**

Run: `pnpm test components/practice/essential-words/__tests__/SessionReadyHero.test.tsx`
Expected: FAIL — banner text not found; `stats` prop not accepted yet

- [ ] **Step 8: Implement the banner in `SessionReadyHero`**

Add `stats` to props and render the banner ahead of the CTA:

```tsx
// components/practice/essential-words/SessionReadyHero.tsx
import { estimateDurationMs } from '@/lib/essential-words/session-plan-time-ceiling'
import { isDailyQuotaMet } from '@/lib/essential-words/daily-quota'
import { PillButton } from '@/components/ui/PillButton'
import { Sparkles } from '@/components/icons'
import type { EssentialWordsCounts, EssentialWordsStats } from '@/hooks/useEssentialWordsSession'
import { SessionReadyRouteHint } from './SessionReadyRouteHint'
import { SessionSurface } from './session-chrome'

interface Props {
  counts: EssentialWordsCounts
  stats: EssentialWordsStats
  isResume: boolean
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
  onBegin: () => void
}
```

Inside the component, after computing `note`:

```tsx
  const quotaMet = !isResume && isDailyQuotaMet(stats)
```

And in the JSX, right after the `<header>` block and before the stats row:

```tsx
      {quotaMet ? (
        <div className="flex items-center gap-2 rounded-md bg-primary-soft px-3 py-2 text-caption text-primary">
          <Sparkles size={14} aria-hidden />
          <span>Ya completaste tu diaria de hoy — esto es práctica extra</span>
        </div>
      ) : null}
```

(Verify `Sparkles` is exported from `@/components/icons` — `SessionDone.tsx` already imports it from there, so it exists.)

- [ ] **Step 9: Run test to verify it passes**

Run: `pnpm test components/practice/essential-words/__tests__/SessionReadyHero.test.tsx`
Expected: PASS, including the two new tests

- [ ] **Step 10: Update `SessionReady.tsx` call site**

Confirm `stats={stats}` is already being passed to `SessionReadyHero` from Task 4 Step 2. If Task 4 wasn't done first, add it now.

- [ ] **Step 11: Run the full essential-words suite + type-check**

Run: `pnpm test lib/essential-words components/practice/essential-words`
Run: `pnpm type-check`
Expected: all PASS, no new type errors

- [ ] **Step 12: Commit**

```bash
git add components/practice/essential-words/SessionReadyHero.tsx components/practice/essential-words/__tests__/SessionReadyHero.test.tsx components/practice/essential-words/SessionReady.tsx
git commit -m "feat(essential-words): show 'ya completaste tu diaria' banner when today's quota is met

Distinguishes 'core daily done, this is bonus practice' from the full
empty-queue SessionDone screen, which only fires once the queue is
completely empty.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Manual verification against the reported screenshot

**Files:** none (manual QA pass)

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`

- [ ] **Step 2: Load `/practice/essential-words` as a logged-in user with 0 SRS entries (fresh account)**

Expected:
- "Racha" shows the same number as the home page header / `/progress` (0 for a fresh account) — confirm by opening `/` in another tab and comparing.
- "Mañana" shows `0 repasos` (nothing scheduled yet — correct, not a bug, since no SRS entries exist).
- No daily-quota-met banner (quota not yet met).

- [ ] **Step 3: Complete today's full daily session (all new + due cards)**

Expected:
- Land on `SessionDone` (`phase: 'done'`) showing stats/struggling words/tomorrow preview — unchanged, already correct.
- Navigate back to `/practice/essential-words`. If the queue still has leftover optional items (e.g. previously-struggling words), the `ready` screen now shows the "Ya completaste tu diaria de hoy" banner instead of a bare "Hoy te tocan N palabras" hero.
- If the queue is fully empty, the `empty`-phase `SessionDone` still renders ("Nada pendiente por hoy") — unchanged.

- [ ] **Step 4: Check "Mañana" now reflects tomorrow's real schedule**

Expected: after grading a few cards (which schedules `nextReview` 1+ days out via FSRS), "Mañana" reflects the count of entries whose `nextReview` lands on tomorrow's date — not today's due count.

- [ ] **Step 5: Confirm streak increments from any qualifying activity, and matches across pages**

Try each independently on a fresh day (or a test account with no activity yet):
- Complete just the daily checklist (no word answers) → reload `/`, `/progress`, `/practice/essential-words` — all three should show streak ≥ 1.
- Read/complete one lesson only → same check.
- Answer a single essential-words card → same check (previously required 5 to count; now 1 is enough).

Confirm the streak number shown is identical across `/`, `/progress`, and `/practice/essential-words` at all times (all three now read `getDailyStreak`).

- [ ] **Step 6: Report findings**

If any expectation above doesn't hold, return to Phase 1 of systematic-debugging rather than patching blindly — do not mark this task done until all 5 checks pass live.

---

## Self-Review Notes

- **Spec coverage:** Q1 (unify streak to real source) → Task 4. Q2 (accurate "Mañana") → Tasks 1–3. Q3 (completed-today indicator) → Task 5. All three user-approved directions covered.
- **Offline mode:** `initialStreak` is a server-fetched prop like the home page's own streak fetch; if offline, the page still renders (Next.js will serve the last SSR'd shell in PWA/offline caching if configured, same as today) and the client-side Dexie-backed `dueTomorrow`/`isDailyQuotaMet` computations keep working fully offline since they only touch Dexie. No feature here is Supabase-only except the streak *display*, which already degrades identically to how the home page's streak already degrades offline (falls back to `0`/cached prop) — no regression versus current behavior for the rest of the page.
- **`db.userStats`/`updateUserStats` cleanup:** intentionally left untouched — it's a separate, older stats structure (`totalXP`, `averageAccuracy`, etc.) that may still be read elsewhere. Only its unused-here `currentStreak` field stops being read by Essential Words after this plan. Do not delete `updateUserStats` without checking other call sites first.
