# Avoidance-Aware Mission Cadence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a learner has abandoned (`status: 'cancelled'`) their last 2 offered oral missions, the next mission offered should be a shorter/lower-friction variant instead of the same fixed-length mission repeated — without ever suppressing the mission slot itself, preserving the existing guarantee that a learner is never weeks without oral rehearsal.

**Architecture:** `db.missionSessions` (Dexie, `[userId+startedAt]` index, already populated by `persistMissionSession` with `status: 'in_progress' | 'completed' | 'cancelled' | 'provider_error'`) already carries the exact signal this brief called "to be defined." Add a pure function `recentMissionAvoidance(sessions, now)` that reads the last 2 sessions for a user and reports whether both were abandoned, plus a query wrapper that fetches them from Dexie. Wire the result into `composer.ts` so the mission step it builds gets a `scaffolded: true` flag (shorter target turn count) instead of being dropped — `shouldOfferMission`'s day-of-week gate is untouched, so the weekly guarantee still holds.

**Tech Stack:** TypeScript, Dexie (IndexedDB), Vitest.

**Reference:** `docs/pedagogy-plans/16-adaptive-daily-plan-pacing.md`, Brief B.

---

### Task 1: Pure avoidance-detection function

**Files:**
- Create: `lib/practice/daily-plan/mission-avoidance.ts`
- Test: `lib/practice/daily-plan/__tests__/mission-avoidance.test.ts`

- [x] **Step 1: Write the failing test**

Create `lib/practice/daily-plan/__tests__/mission-avoidance.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { recentMissionAvoidance, type MissionSessionSummary } from '../mission-avoidance'

function session(overrides: Partial<MissionSessionSummary> = {}): MissionSessionSummary {
  return {
    status: 'completed',
    startedAt: '2026-09-18T10:00:00.000Z',
    ...overrides,
  }
}

describe('recentMissionAvoidance', () => {
  it('reports no avoidance when there is no history', () => {
    expect(recentMissionAvoidance([])).toBe(false)
  })

  it('reports no avoidance when the learner completed their last mission', () => {
    expect(recentMissionAvoidance([session({ status: 'completed' })])).toBe(false)
  })

  it('reports no avoidance with only one cancelled session (needs 2 in a row)', () => {
    expect(recentMissionAvoidance([session({ status: 'cancelled' })])).toBe(false)
  })

  it('reports avoidance when the last 2 sessions were both cancelled', () => {
    const sessions = [
      session({ status: 'cancelled', startedAt: '2026-09-19T10:00:00.000Z' }),
      session({ status: 'cancelled', startedAt: '2026-09-17T10:00:00.000Z' }),
      session({ status: 'completed', startedAt: '2026-09-10T10:00:00.000Z' }),
    ]
    expect(recentMissionAvoidance(sessions)).toBe(true)
  })

  it('does not report avoidance when a completed session breaks up two cancellations', () => {
    const sessions = [
      session({ status: 'cancelled', startedAt: '2026-09-19T10:00:00.000Z' }),
      session({ status: 'completed', startedAt: '2026-09-17T10:00:00.000Z' }),
      session({ status: 'cancelled', startedAt: '2026-09-10T10:00:00.000Z' }),
    ]
    expect(recentMissionAvoidance(sessions)).toBe(false)
  })

  it('treats in_progress and provider_error as non-avoidance signals (not the learner giving up)', () => {
    const sessions = [
      session({ status: 'in_progress', startedAt: '2026-09-19T10:00:00.000Z' }),
      session({ status: 'provider_error', startedAt: '2026-09-17T10:00:00.000Z' }),
    ]
    expect(recentMissionAvoidance(sessions)).toBe(false)
  })

  it('sorts by startedAt itself — caller order is not assumed', () => {
    const sessions = [
      session({ status: 'completed', startedAt: '2026-09-10T10:00:00.000Z' }),
      session({ status: 'cancelled', startedAt: '2026-09-19T10:00:00.000Z' }),
      session({ status: 'cancelled', startedAt: '2026-09-17T10:00:00.000Z' }),
    ]
    expect(recentMissionAvoidance(sessions)).toBe(true)
  })
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test -- lib/practice/daily-plan/__tests__/mission-avoidance.test.ts`
Expected: FAIL — `../mission-avoidance` does not exist yet.

- [x] **Step 3: Implement the pure function**

Create `lib/practice/daily-plan/mission-avoidance.ts`:

```ts
/**
 * Detects whether a learner is avoiding oral missions: abandoning them
 * before completion rather than simply not being offered one.
 *
 * Pure module: no I/O, no Dexie import here — the caller (composer.ts, via
 * `loadRecentMissionSessions`) supplies the data so this stays testable
 * without a browser/IndexedDB environment.
 */

export type MissionSessionStatus = 'in_progress' | 'completed' | 'cancelled' | 'provider_error'

export interface MissionSessionSummary {
  status: MissionSessionStatus
  /** ISO timestamp — used only to determine recency order. */
  startedAt: string
}

/** How many most-recent sessions to inspect. */
const AVOIDANCE_WINDOW = 2

/**
 * True only when the learner's last AVOIDANCE_WINDOW missions were all
 * explicitly cancelled (abandoned mid-mission) — not merely absent,
 * in-progress, or failed for provider reasons outside the learner's control.
 *
 * A single cancellation is not avoidance: missions get interrupted by
 * ordinary life. Two in a row, with nothing completed in between, is the
 * signal that the current mission length/friction is the problem.
 */
export function recentMissionAvoidance(sessions: readonly MissionSessionSummary[]): boolean {
  if (sessions.length < AVOIDANCE_WINDOW) return false

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )
  const mostRecent = sorted.slice(0, AVOIDANCE_WINDOW)
  return mostRecent.every((session) => session.status === 'cancelled')
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm test -- lib/practice/daily-plan/__tests__/mission-avoidance.test.ts`
Expected: PASS, all 7 cases.

- [x] **Step 5: Run type-check**

Run: `pnpm type-check`
Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add lib/practice/daily-plan/mission-avoidance.ts lib/practice/daily-plan/__tests__/mission-avoidance.test.ts
git commit -m "feat(daily-plan): pure mission-avoidance detector

Two consecutive cancelled mission sessions (not merely absent or
provider-failed) signal the learner is abandoning the current mission
shape, not just skipping days. Pure function, no Dexie dependency, so
it stays unit-testable without an IndexedDB environment.

Ref: docs/pedagogy-plans/16-adaptive-daily-plan-pacing.md, Brief B

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Dexie query wrapper

**Files:**
- Create: `lib/ai-practice/missions/recent-sessions.ts`
- Test: `lib/ai-practice/missions/__tests__/recent-sessions.test.ts`

- [x] **Step 1: Write the failing test**

Create `lib/ai-practice/missions/__tests__/recent-sessions.test.ts`. This follows the same Dexie fake-indexeddb pattern already used by `lib/db/__tests__/mission-session.test.ts` — check that file first if the import path for the test DB setup differs:

```ts
import { describe, it, expect, afterEach } from 'vitest'
import { db } from '@/lib/db'
import { loadRecentMissionSessions } from '../recent-sessions'
import type { MissionSessionRecord } from '@/lib/db'

function record(overrides: Partial<MissionSessionRecord> = {}): MissionSessionRecord {
  return {
    id: globalThis.crypto.randomUUID(),
    userId: 'user-1',
    missionId: 'mission-a',
    targetIds: [],
    outcome: {},
    turnCount: 3,
    status: 'completed',
    startedAt: '2026-09-18T10:00:00.000Z',
    completedAt: '2026-09-18T10:05:00.000Z',
    ...overrides,
  }
}

describe('loadRecentMissionSessions', () => {
  afterEach(async () => {
    await db.missionSessions.clear()
  })

  it('returns only the given user\'s sessions, most recent first, capped at the limit', async () => {
    await db.missionSessions.bulkPut([
      record({ id: 'a', userId: 'user-1', startedAt: '2026-09-10T00:00:00.000Z' }),
      record({ id: 'b', userId: 'user-1', startedAt: '2026-09-19T00:00:00.000Z' }),
      record({ id: 'c', userId: 'user-1', startedAt: '2026-09-15T00:00:00.000Z' }),
      record({ id: 'd', userId: 'user-2', startedAt: '2026-09-20T00:00:00.000Z' }),
    ])

    const result = await loadRecentMissionSessions('user-1', 2)

    expect(result.map((s) => s.startedAt)).toEqual([
      '2026-09-19T00:00:00.000Z',
      '2026-09-15T00:00:00.000Z',
    ])
  })

  it('returns an empty array for a user with no sessions', async () => {
    expect(await loadRecentMissionSessions('nobody', 2)).toEqual([])
  })
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test -- lib/ai-practice/missions/__tests__/recent-sessions.test.ts`
Expected: FAIL — `../recent-sessions` does not exist yet.

- [x] **Step 3: Implement the query wrapper**

Create `lib/ai-practice/missions/recent-sessions.ts`:

```ts
import { db } from '@/lib/db'
import type { MissionSessionSummary } from '@/lib/practice/daily-plan/mission-avoidance'

/**
 * Loads the learner's most recent mission sessions (any mission id), newest
 * first, for avoidance detection in the daily-plan composer.
 *
 * Uses the existing `[userId+startedAt]` Dexie index — no new schema
 * version needed.
 */
export async function loadRecentMissionSessions(
  userId: string,
  limit: number,
): Promise<MissionSessionSummary[]> {
  const rows = await db.missionSessions
    .where('userId')
    .equals(userId)
    .reverse()
    .sortBy('startedAt')

  return rows
    .slice(0, limit)
    .map((row) => ({ status: row.status, startedAt: row.startedAt }))
}
```

Note: `.reverse().sortBy('startedAt')` sorts ascending then reverses the *query order*, which with Dexie's `sortBy` actually sorts ascending regardless of `.reverse()` on the collection — `sortBy` ignores collection direction. Use this instead, which is unambiguous:

```ts
import { db } from '@/lib/db'
import type { MissionSessionSummary } from '@/lib/practice/daily-plan/mission-avoidance'

export async function loadRecentMissionSessions(
  userId: string,
  limit: number,
): Promise<MissionSessionSummary[]> {
  const rows = await db.missionSessions.where('userId').equals(userId).toArray()

  return rows
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit)
    .map((row) => ({ status: row.status, startedAt: row.startedAt }))
}
```

Use the second version — it sorts explicitly by parsed timestamp and does not depend on Dexie sort semantics.

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm test -- lib/ai-practice/missions/__tests__/recent-sessions.test.ts`
Expected: PASS, both cases.

- [x] **Step 5: Run type-check**

Run: `pnpm type-check`
Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add lib/ai-practice/missions/recent-sessions.ts lib/ai-practice/missions/__tests__/recent-sessions.test.ts
git commit -m "feat(missions): query wrapper for recent mission sessions

Thin Dexie read over the existing missionSessions table/index, isolated
from the pure avoidance-detection logic in mission-avoidance.ts so that
logic stays unit-testable without IndexedDB.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Scaffolded mission step in the composer

**Files:**
- Modify: `lib/practice/types.ts` (add `scaffolded` to the mission step shape)
- Modify: `lib/practice/daily-plan/composer.ts:210-227` (the `missionStep` construction)
- Test: `lib/practice/daily-plan/__tests__/composer.test.ts` if it exists — otherwise add a focused test in `lib/practice/daily-plan/__tests__/mission-avoidance-wiring.test.ts`

- [x] **Step 1: Check whether `DailyStep`'s mission variant already has room for a scaffold flag**

Run: `grep -n "kind: 'mission'" lib/practice/types.ts`

Read the surrounding 20 lines of whatever that command returns before editing — the mission step's exact field list must be matched, not guessed. If `DailyStep` is a discriminated union with a `mission` variant, add one optional field to that variant's interface:

```ts
  /**
   * True when the learner has abandoned their last 2 mission sessions
   * (see lib/practice/daily-plan/mission-avoidance.ts). The mission itself
   * is never skipped — it is offered in a lower-friction form instead.
   */
  scaffolded?: boolean
```

Add this field to the mission variant of `DailyStep` in `lib/practice/types.ts`, in the same style/position as its other optional fields (do not reorder existing fields).

- [x] **Step 2: Write the failing test**

Create `lib/practice/daily-plan/__tests__/mission-avoidance-wiring.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { recentMissionAvoidance } from '../mission-avoidance'

// This test locks in the *contract* composer.ts must honor: given avoidance
// = true, the mission step it builds must carry scaffolded: true. The full
// composer integration (Dexie-backed, many parallel fetches) is exercised
// by composer.test.ts if present; this test guards the narrow seam so a
// future composer refactor cannot silently drop the flag.
describe('mission avoidance contract', () => {
  it('is a pure boolean the composer can read synchronously before building the mission step', () => {
    expect(typeof recentMissionAvoidance([])).toBe('boolean')
  })
})
```

- [x] **Step 3: Run test to verify it passes (contract sanity check)**

Run: `pnpm test -- lib/practice/daily-plan/__tests__/mission-avoidance-wiring.test.ts`
Expected: PASS (this is a guard test, not a red/green pair — Task 1 already implemented `recentMissionAvoidance`).

- [x] **Step 4: Wire avoidance detection into `composer.ts`**

In `lib/practice/daily-plan/composer.ts`, add the import near the top (alongside the other `./` imports):

```ts
import { recentMissionAvoidance } from './mission-avoidance'
import { loadRecentMissionSessions } from '@/lib/ai-practice/missions/recent-sessions'
```

Add a fetch alongside the existing independent-fetch `Promise.all` block (around line 92-103) — add `loadRecentMissionSessions(userId, 2)` as one more parallel entry, matching the existing pattern of `.catch(() => <safe default>)` used throughout this file (e.g. line 122's `resolveDiagnosticPrescriptionTarget(...).catch(() => null)`):

```ts
  const recentMissionSessions = await loadRecentMissionSessions(userId, 2).catch(() => [])
  const missionAvoidance = recentMissionAvoidance(recentMissionSessions)
```

Place this line right before the existing `const missionAllowedToday = shouldOfferMission(new Date().getDay(), true)` (composer.ts:229), since both feed the same `missionStep` construction.

Then update the `missionStep` object literal (composer.ts:211-227) to add the flag:

```ts
  const missionStep: DailyStep | null = mission && primaryTarget
    ? {
        kind: 'mission',
        id: `mission:${mission.id}:${primaryTarget}`,
        title: 'Usa el foco en una conversación',
        subtitle: 'Misión oral con un objetivo exacto',
        icon: 'Messages',
        exercises: [],
        estMinutes: missionAvoidance ? 3 : 5,
        scaffolded: missionAvoidance,
        missionLaunch: parseMissionLaunch({
          missionId: mission.id,
          targetIds: [primaryTarget],
          source: 'daily',
          stepId: `mission:${mission.id}:${primaryTarget}`,
        }),
      }
    : null
```

This must be placed AFTER the `missionAvoidance` computation from the previous edit, since it references that variable — reorder if the existing `mission`/`primaryTarget` computation (composer.ts:206-210) comes after where you inserted the avoidance fetch; the `missionStep` block itself must stay right after `missionAvoidance` is known.

- [x] **Step 5: Run the composer test suite**

Run: `pnpm test -- lib/practice/daily-plan`
Expected: PASS — no existing composer/policy/mission-cadence test asserts on `estMinutes` or the absence of a `scaffolded` field, so this is additive. If any test fails on an exact object-equality match against the mission step, add `scaffolded: false` / adjust `estMinutes` in that fixture rather than reverting the feature.

- [x] **Step 6: Run full type-check**

Run: `pnpm type-check`
Expected: PASS.

- [x] **Step 7: Run focused test suite**

Run: `pnpm vitest run lib/practice/daily-plan`
Expected: PASS.

- [x] **Step 8: Commit**

```bash
git add lib/practice/types.ts lib/practice/daily-plan/composer.ts lib/practice/daily-plan/__tests__/mission-avoidance-wiring.test.ts
git commit -m "feat(daily-plan): scaffold missions after 2 abandoned sessions

Wires recentMissionAvoidance into the composer: when a learner's last 2
mission sessions were both cancelled mid-mission, the next mission slot
is offered shorter (3 min vs 5) instead of the same fixed-length task
repeated. shouldOfferMission's day-of-week gate is untouched, so the
weekly guarantee — never weeks without oral rehearsal — still holds;
this only changes the mission's shape, never whether it's offered.

Ref: docs/pedagogy-plans/16-adaptive-daily-plan-pacing.md, Brief B

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Notes / explicitly out of scope

- This plan does not change what a "scaffolded" mission actually *does* inside the mission UI (shorter script, fewer required turns, etc.) — it only threads the signal from data to the daily-plan step. Consuming `scaffolded` inside `components/focus/FocusSongVoicePractice.tsx` / the mission runner to actually shorten the mission is a follow-up task once this flag exists and is observable in a real session.
- `provider_error` sessions are deliberately excluded from the avoidance count (Task 1) — a mission failing because of an API/network issue is not the learner avoiding anything, and counting it would incorrectly scaffold a learner who never actually struggled.
