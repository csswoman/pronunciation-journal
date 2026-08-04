# Essential Words — Fase C: Migración SM-2 → FSRS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace SM-2 with FSRS as the scheduler behind `SRSData` for the two write paths that actually schedule intervals (`gradeEssentialWord`, `upsertFragmentSrs`), with a fresh-start migration model, corrected stability/difficulty derivation, and a graduation grade computed from performance — while leaving `deck_entry_progress` on SM-2 permanently by design.

**Architecture:** `SRSData` (`lib/types.ts`) gains additive optional fields (`stability`, `difficulty`, `state`, `fsrsRealReviews`) rather than a parallel Dexie table — both write paths already share this one interface and `updateSRS`, and a parallel table would force every read-only call site to join two tables for no benefit. `lib/srs/fsrs-migrate.ts` derives an initial FSRS state from existing SM-2 fields with no retroactive recompute. `lib/srs/fsrs-schedule.ts` wraps `ts-fsrs` the same way `lib/srs/schedule.ts` wraps SM-2 today: pure, no I/O, explicit clock. `lib/essential-words/graduation-grade.ts` computes the graduation `Grade` from performance, independent of scheduling, reusing Fase B's `Grade` type from `attempt-grade.ts`.

**Tech Stack:** TypeScript, `ts-fsrs@5.4.1` (added this phase — verified on the npm registry and its exported API confirmed against the installed package's `.d.ts` before writing this plan), Dexie 4, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-08-04-essential-words-learning-sessions-design.md`, §3 in full.

---

## Context the engineer needs

- **Only 3 files schedule intervals** in this codebase (confirmed by reading each): `lib/essential-words/grade.ts` (`gradeEssentialWord`), `lib/practice/fragment-srs.ts` (`upsertFragmentSrs`), `components/vocabulary/decks/study-utils.ts`. The rest of the ~25-30 files that import `SRSData` only read the type — they are unaffected by this plan.
- **`components/vocabulary/decks/study-utils.ts` is out of scope, permanently, by design** (spec §3.1). It schedules `deck_entry_progress`, a different table with a different shape, via the same shared `lib/srs/schedule.ts` pure function but with no relationship to `SRSData`. This plan does not touch it (see Task 0).
- **`ts-fsrs@5.4.1`'s real exported API** (verified directly against the installed package's `dist/index.d.ts`, not assumed): `fsrs()`, `generatorParameters()`, `Rating` (enum: `Manual=0, Again=1, Hard=2, Good=3, Easy=4`), `State` (enum: `New=0, Learning=1, Review=2, Relearning=3`), `Grade` (type = `Exclude<Rating, Rating.Manual>`). The `Card` interface is:
  ```ts
  interface Card {
    due: Date; stability: number; difficulty: number; elapsed_days: number;
    scheduled_days: number; learning_steps: number; reps: number; lapses: number;
    state: State; last_review?: Date;
  }
  ```
  `FSRS.next(card, now, grade)` returns a single `RecordLogItem = { card: Card; log: ReviewLog }` — **not** a rating-keyed lookup table (that shape, `RecordLog`, is a different type produced by a different method, `repeat`, which this plan does not use). Get the next state via `result.card`, not `result[Rating.Good]` or similar.
- **`lib/srs/schedule.ts`** is the existing pure SM-2 scheduler (`scheduleNextReview(input): ScheduleResult`). It is not deleted — it remains in permanent use by `study-utils.ts`.
- **`lib/essential-words/grade.ts`'s existing side effects** beyond scheduling (`saveAttempt`, `calculateXP`, `updateDailyProgress`, `updateUserStats`, `savePracticeAnswer`) must survive this migration completely unchanged — only the internals of how `SRSData` gets its next `nextReview`/scheduling fields change.
- **Fase B's `Grade` type** (`'Again' | 'Hard' | 'Good' | 'Easy'`) lives in `lib/essential-words/attempt-grade.ts` — this plan imports and reuses it rather than redefining a duplicate union. If Fase B has not been implemented yet when this plan runs, Task 6 defines the shape locally as a fallback and flags it for reconciliation (see Task 6's note).
- **The review log** (`srsRatingEvents` extended with `entityType: "essential_words"`) is built by Fase A (`lib/db/index.ts`, `recordEssentialWordsReviewEvent`) — this plan **consumes** the schema, it does not build it. If Fase A has not landed, Task 5's `isEligibleForOptimizer` predicate still compiles and is unit-tested against a locally-typed row shape; wiring it to the real Dexie table happens naturally once Fase A's table exists, with no further code change required (the predicate takes a plain object, not a Dexie-bound type).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `lib/srs/fsrs-migrate.ts` | Create | Pure `deriveFsrsState` — SM-2 → FSRS initial-state derivation (§3.2) |
| `lib/srs/fsrs-schedule.ts` | Create | Pure `ts-fsrs` wrapper — single source of truth for FSRS scheduling |
| `lib/srs/fsrs-optimizer-eligibility.ts` | Create | `isEligibleForOptimizer` + `fsrsRealReviews` counter logic (§3.2) |
| `lib/essential-words/graduation-grade.ts` | Create | `graduationGrade()` — mode as ceiling, not assignment (§3.4) |
| `lib/types.ts` | Modify | `SRSData` gains `stability?`, `difficulty?`, `state?`, `fsrsRealReviews?` |
| `lib/essential-words/grade.ts` | Modify | `gradeEssentialWord` calls `fsrs-schedule.ts` instead of `updateSRS` |
| `lib/practice/fragment-srs.ts` | Modify | `upsertFragmentSrs` calls `fsrs-schedule.ts` instead of `updateSRS` |
| `package.json` | Modify | Add `ts-fsrs@5.4.1` |

---

## Task 0 (note, not implemented): `deck_entry_progress` stays out of scope

`components/vocabulary/decks/study-utils.ts` schedules a **third** table, `deck_entry_progress`, via the same shared `scheduleNextReview` pure function `lib/srs/schedule.ts` exports — but it does not touch `SRSData` at all. Per spec §3.1:

> El tercero opera sobre **otra tabla y otro modelo de datos** (progreso de mazos, no `SRSData`); forzarlo dentro acoplaría dos dominios por una falsa simetría. Queda como excepción **declarada aquí con su razón**, no como olvido.

No task in this plan modifies `components/vocabulary/decks/study-utils.ts` or `lib/srs/schedule.ts`. Both stay exactly as they are, permanently, for `deck_entry_progress`.

---

### Task 1: Add `ts-fsrs` dependency

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (generated)

- [ ] **Step 1: Install the exact pinned version**

Run: `pnpm add ts-fsrs@5.4.1`

Expected: `package.json` gains `"ts-fsrs": "5.4.1"` (exact, no `^`) under `dependencies`.

> Pin exact — FSRS's default parameter weights are load-bearing for the scheduler's behavior. A silent minor bump changing default weights would change every card's computed interval without a code diff to review.

- [ ] **Step 2: Confirm zero-usage install compiles clean**

Run: `pnpm type-check`
Expected: exit 0. `ts-fsrs` is installed but not yet imported anywhere.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(srs): add ts-fsrs@5.4.1 dependency for Fase C migration"
```

---

### Task 2: `lib/srs/fsrs-migrate.ts` — migration-state derivation

**Files:**
- Create: `lib/srs/fsrs-migrate.ts`
- Test: `lib/srs/__tests__/fsrs-migrate.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/srs/__tests__/fsrs-migrate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { deriveFsrsState } from "../fsrs-migrate";
import type { SRSData } from "@/lib/types";

const NOW = new Date("2026-08-04T00:00:00.000Z");
const DAY_MS = 86_400_000;

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * DAY_MS).toISOString();
}

function makeCard(overrides: Partial<SRSData> = {}): SRSData {
  return {
    wordId: "c1k:test", word: "test", ease: 2.5, interval: 30,
    repetitions: 3, nextReview: daysAgo(-30), lastReview: daysAgo(1),
    ...overrides,
  };
}

describe("deriveFsrsState — healthy card (elapsedDays <= interval)", () => {
  it("uses interval as stability, not elapsedDays — never crushes a healthy card to 1", () => {
    const card = makeCard({ interval: 60, lastReview: daysAgo(1) });
    expect(deriveFsrsState(card, NOW).stability).toBe(60);
  });

  it("uses interval as stability at the exact boundary elapsedDays === interval", () => {
    const card = makeCard({ interval: 10, lastReview: daysAgo(10) });
    expect(deriveFsrsState(card, NOW).stability).toBe(10);
  });
});

describe("deriveFsrsState — stale card (elapsedDays > interval)", () => {
  it("uses max(1, elapsedDays), not the stale interval", () => {
    const card = makeCard({ interval: 30, lastReview: daysAgo(90) });
    expect(deriveFsrsState(card, NOW).stability).toBe(90);
  });

  it("floors stability at 1 for a same-day-lapsed zero-interval card", () => {
    const card = makeCard({ interval: 0, lastReview: daysAgo(0) });
    expect(deriveFsrsState(card, NOW).stability).toBeGreaterThanOrEqual(1);
  });
});

describe("deriveFsrsState — missing lastReview (never reviewed)", () => {
  it("treats elapsedDays as 0, falling into the healthy branch using interval (floored at 1)", () => {
    const card = makeCard({ interval: 0, lastReview: undefined });
    expect(deriveFsrsState(card, NOW).stability).toBeGreaterThanOrEqual(1);
  });
});

describe("deriveFsrsState — difficulty derivation from ease", () => {
  it("maps ease=1.3 (hardest SM-2) to difficulty=10 (hardest FSRS)", () => {
    expect(deriveFsrsState(makeCard({ ease: 1.3 }), NOW).difficulty).toBe(10);
  });

  it("maps ease=2.5 (default SM-2) to difficulty=1 (easiest FSRS)", () => {
    expect(deriveFsrsState(makeCard({ ease: 2.5 }), NOW).difficulty).toBe(1);
  });

  it("clamps difficulty to [1,10] for ease outside the nominal SM-2 range", () => {
    const high = deriveFsrsState(makeCard({ ease: 3.5 }), NOW);
    const low = deriveFsrsState(makeCard({ ease: 0.5 }), NOW);
    expect(high.difficulty).toBeGreaterThanOrEqual(1);
    expect(high.difficulty).toBeLessThanOrEqual(10);
    expect(low.difficulty).toBeGreaterThanOrEqual(1);
    expect(low.difficulty).toBeLessThanOrEqual(10);
  });
});

describe("deriveFsrsState — property sweep", () => {
  it("stability is never below 1, and matches the correct branch, for a spread of interval/elapsedDays pairs", () => {
    for (let interval = 0; interval <= 400; interval += 17) {
      for (let elapsedDays = 0; elapsedDays <= 400; elapsedDays += 23) {
        const card = makeCard({
          interval,
          lastReview: new Date(NOW.getTime() - elapsedDays * DAY_MS).toISOString(),
        });
        const result = deriveFsrsState(card, NOW);
        expect(result.stability).toBeGreaterThanOrEqual(1);
        if (elapsedDays <= interval) {
          expect(result.stability).toBe(Math.max(1, interval));
        } else {
          expect(result.stability).toBe(Math.max(1, Math.round(elapsedDays)));
        }
      }
    }
  });
});

describe("deriveFsrsState — purity", () => {
  it("does not mutate the input card", () => {
    const card = makeCard();
    const snapshot = { ...card };
    deriveFsrsState(card, NOW);
    expect(card).toEqual(snapshot);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/srs/__tests__/fsrs-migrate.test.ts`
Expected: FAIL — cannot resolve `../fsrs-migrate`.

- [ ] **Step 3: Write the implementation**

Create `lib/srs/fsrs-migrate.ts`:

```ts
/**
 * SM-2 -> FSRS migration-state derivation (Fase C, spec §3.2).
 *
 * Fresh-start migration: no retroactive recompute. There is no historical
 * review log for essential-words prior to Fase A, so there is nothing to
 * recalculate from — this derives a one-time initial FSRS state from the
 * current SM-2 fields at the moment a card is first touched by the FSRS
 * scheduler.
 *
 * STABILITY. An earlier formulation applied `min(interval, elapsedDays)` to
 * every card. That is wrong: "underestimating is safe" only holds for
 * OVERDUE cards. Applied to a healthy card — 60-day interval, reviewed
 * yesterday — it produces stability=1 and floods the review queue with
 * cards that don't need it.
 *
 *   elapsedDays = now - lastReview (days, floored at 0 when lastReview is
 *                 absent, i.e. a never-reviewed card)
 *
 *   elapsedDays <= interval  ->  stability = max(1, interval)  (healthy: trust the interval)
 *   elapsedDays >  interval  ->  stability = max(1, elapsedDays) (overdue: conservative)
 *
 * Floor of stability = 1 in BOTH branches — stability = 0 is degenerate in
 * FSRS.
 *
 * DIFFICULTY. Derived from `ease`, not defaulted — FSRS needs both
 * stability and difficulty; defaulting difficulty for every migrated card
 * would lose the signal for which words were hard. Maps SM-2's ease range
 * (1.3-2.5) to FSRS's difficulty range (1-10), inverted: higher ease
 * (easier in SM-2) maps to lower difficulty (easier in FSRS).
 *
 *   difficulty = clamp(1, 10, round(11 - 9 * (ease - 1.3) / (2.5 - 1.3)))
 */

import type { SRSData } from "@/lib/types";

export interface DerivedFsrsState {
  stability: number;
  difficulty: number;
}

const EASE_MIN = 1.3;
const EASE_MAX = 2.5;
const DAY_MS = 86_400_000;

function clamp(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

function elapsedDaysSince(lastReview: string | undefined, now: Date): number {
  if (!lastReview) return 0;
  const diffMs = now.getTime() - new Date(lastReview).getTime();
  return Math.max(0, diffMs / DAY_MS);
}

/** Derives a one-time FSRS (stability, difficulty) pair from a card's
 *  current SM-2 state. Pure — no I/O, no implicit clock (pass `now`). */
export function deriveFsrsState(current: SRSData, now: Date): DerivedFsrsState {
  const elapsedDays = elapsedDaysSince(current.lastReview, now);
  const interval = current.interval;

  const stability =
    elapsedDays <= interval
      ? Math.max(1, Math.round(interval))
      : Math.max(1, Math.round(elapsedDays));

  const difficulty = clamp(
    1,
    10,
    Math.round(11 - (9 * (current.ease - EASE_MIN)) / (EASE_MAX - EASE_MIN)),
  );

  return { stability, difficulty };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/srs/__tests__/fsrs-migrate.test.ts`
Expected: PASS — including the property sweep (a nested loop, not a randomized property library, so no new devDependency is needed).

- [ ] **Step 5: Commit**

```bash
git add lib/srs/fsrs-migrate.ts lib/srs/__tests__/fsrs-migrate.test.ts
git commit -m "feat(srs): add FSRS migration-state derivation, corrected stability formula (spec §3.2)"
```

---

### Task 3: `lib/types.ts` — extend `SRSData` with FSRS fields

**Files:**
- Modify: `lib/types.ts`
- Test: `lib/srs/__tests__/fsrs-fields.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/srs/__tests__/fsrs-fields.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type { SRSData } from "@/lib/types";

describe("SRSData FSRS fields (additive)", () => {
  it("a pre-migration SRSData value (no FSRS fields) still satisfies the type", () => {
    const legacy: SRSData = {
      wordId: "c1k:legacy", word: "legacy", ease: 2.5, interval: 10,
      repetitions: 2, nextReview: "2026-08-10T00:00:00.000Z",
    };
    expect(legacy.stability).toBeUndefined();
    expect(legacy.difficulty).toBeUndefined();
    expect(legacy.state).toBeUndefined();
    expect(legacy.fsrsRealReviews).toBeUndefined();
  });

  it("a migrated SRSData value can carry all four FSRS fields", () => {
    const migrated: SRSData = {
      wordId: "c1k:migrated", word: "migrated", ease: 2.5, interval: 10,
      repetitions: 2, nextReview: "2026-08-10T00:00:00.000Z",
      stability: 10, difficulty: 3, state: "Review", fsrsRealReviews: 0,
    };
    expect(migrated.state).toBe("Review");
    expect(migrated.fsrsRealReviews).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/srs/__tests__/fsrs-fields.test.ts`
Expected: FAIL — TypeScript error, unknown properties `stability`/`difficulty`/`state`/`fsrsRealReviews` on `SRSData`.

- [ ] **Step 3: Add the fields to `SRSData`**

In `lib/types.ts`, find `export interface SRSData` and add the new fields after its last existing field (do not reorder or remove anything already there — read the interface first to confirm what its last field currently is, and append after it):

```ts
export type FsrsCardState = "New" | "Learning" | "Review" | "Relearning";
```

(add this type alias above the `SRSData` interface, near it)

```ts
  /**
   * FSRS fields (Fase C, spec §3). Additive and optional so the files that
   * only read SRSData for its SM-2 fields (ease/interval/repetitions) are
   * unaffected. Absent on any row never touched by the FSRS scheduler
   * (lib/srs/fsrs-schedule.ts) — e.g. deck_entry_progress-backed flows never
   * populate these, because that table is a permanent SM-2 exception
   * (spec §3.1) and doesn't even use SRSData.
   */
  stability?: number;
  difficulty?: number;
  /** FSRS card state per ts-fsrs's model. Absent ≡ not yet FSRS-scheduled. */
  state?: FsrsCardState;
  /**
   * Counts real (non-migrated-noise) reviews since this card was migrated
   * onto FSRS. A migrated card's initial stability/difficulty
   * (lib/srs/fsrs-migrate.ts) are invented estimates, not measurements —
   * every review against them is excluded from the optimizer until this
   * reaches 3 (spec §3.2). Undefined on a card that was never migrated
   * (created fresh under FSRS): treat as already-eligible (see
   * lib/srs/fsrs-optimizer-eligibility.ts).
   */
  fsrsRealReviews?: number;
```

(add these fields inside the `SRSData` interface body, as the last members)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/srs/__tests__/fsrs-fields.test.ts`
Run: `pnpm type-check`
Expected: both pass/exit 0.

- [ ] **Step 5: Confirm no existing `SRSData`-typed code broke**

Run: `pnpm type-check`
Expected: exit 0 (this is an additive change — all four new fields are optional). If it fails elsewhere, investigate whether some call site does an exhaustive object-shape check against `SRSData`; fix that call site, do not loosen the new fields.

- [ ] **Step 6: Commit**

```bash
git add lib/types.ts lib/srs/__tests__/fsrs-fields.test.ts
git commit -m "feat(types): add optional FSRS fields to SRSData (additive, spec §3.2)"
```

---

### Task 4: `lib/srs/fsrs-schedule.ts` — the FSRS scheduler wrapper

**Files:**
- Create: `lib/srs/fsrs-schedule.ts`
- Test: `lib/srs/__tests__/fsrs-schedule.test.ts`

This wraps `ts-fsrs`'s real, verified API (see "Context the engineer needs" above) — `fsrs()`, `Card`, `.next(card, now, rating)` returning `{ card, log }`.

- [ ] **Step 1: Write the failing test**

Create `lib/srs/__tests__/fsrs-schedule.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { scheduleFsrsReview, type FsrsScheduleInput } from "../fsrs-schedule";

const NOW = new Date("2026-08-04T00:00:00.000Z");

function baseInput(overrides: Partial<FsrsScheduleInput> = {}): FsrsScheduleInput {
  return { stability: 10, difficulty: 5, state: "Review", grade: "Good", now: NOW, ...overrides };
}

describe("scheduleFsrsReview", () => {
  it("returns stability, difficulty, an interval in whole days, a future due date, and a state", () => {
    const r = scheduleFsrsReview(baseInput());
    expect(r.stability).toBeGreaterThan(0);
    expect(r.difficulty).toBeGreaterThanOrEqual(1);
    expect(r.difficulty).toBeLessThanOrEqual(10);
    expect(r.interval).toBeGreaterThanOrEqual(1);
    expect(r.dueAt.getTime()).toBeGreaterThan(NOW.getTime());
    expect(r.state).toBeDefined();
  });

  it("Again produces a shorter or equal interval than Good, and lands in Learning or Relearning", () => {
    const good = scheduleFsrsReview(baseInput({ grade: "Good" }));
    const again = scheduleFsrsReview(baseInput({ grade: "Again" }));
    expect(again.interval).toBeLessThanOrEqual(good.interval);
    expect(["Learning", "Relearning"]).toContain(again.state);
  });

  it("Easy produces a longer or equal interval than Good from the same starting state", () => {
    const good = scheduleFsrsReview(baseInput({ grade: "Good" }));
    const easy = scheduleFsrsReview(baseInput({ grade: "Easy" }));
    expect(easy.interval).toBeGreaterThanOrEqual(good.interval);
  });

  it("a brand-new card (state: New, stability/difficulty 0) with grade Good transitions out of New", () => {
    const r = scheduleFsrsReview(baseInput({ state: "New", stability: 0, difficulty: 0, grade: "Good" }));
    expect(r.state).not.toBe("New");
  });

  it("is deterministic for a fixed now and the default parameter set", () => {
    const a = scheduleFsrsReview(baseInput());
    const b = scheduleFsrsReview(baseInput());
    expect(a).toEqual(b);
  });

  it("does not mutate the input object", () => {
    const input = baseInput();
    const snapshot = { ...input };
    scheduleFsrsReview(input);
    expect(input).toEqual(snapshot);
  });

  it("falls back to the current date when now is omitted", () => {
    const before = Date.now();
    const r = scheduleFsrsReview({ stability: 10, difficulty: 5, state: "Review", grade: "Good" });
    expect(r.dueAt.getTime()).toBeGreaterThan(before);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/srs/__tests__/fsrs-schedule.test.ts`
Expected: FAIL — cannot resolve `../fsrs-schedule`.

- [ ] **Step 3: Write the implementation**

Create `lib/srs/fsrs-schedule.ts`:

```ts
/**
 * Shared, pure FSRS scheduler (Fase C), mirroring how lib/srs/schedule.ts
 * wraps SM-2: no DB access, no implicit clock (pass `now`). Wraps ts-fsrs's
 * `FSRS` class with the library's default parameter weights — deliberate:
 * FSRS's optimizer (out of scope this phase, spec §8) tunes those weights
 * against the review log, and doing that requires the model to have been
 * used with its STANDARD parameterization, not a per-mode scaling hack.
 * See lib/essential-words/graduation-grade.ts for why graduation does not
 * scale initial stability by exercise mode either — same reasoning.
 *
 * lib/srs/schedule.ts (SM-2) is NOT deprecated by this module — it remains
 * permanently the scheduler for deck_entry_progress (spec §3.1 exception).
 *
 * API verified directly against the installed ts-fsrs@5.4.1 package's
 * dist/index.d.ts before writing this file: fsrs()/generatorParameters()
 * are named exports; FSRS.next(card, now, grade) returns a single
 * RecordLogItem = { card: Card; log: ReviewLog } — not a rating-keyed
 * lookup table (that's a different method, `repeat`, not used here).
 */

import { fsrs, generatorParameters, Rating, State } from "ts-fsrs";
import type { Card, Grade as FsrsRating } from "ts-fsrs";
import type { FsrsCardState } from "@/lib/types";

/** Mirrors Fase B's attempt-grade.ts Grade union (spec §2.1). Duplicated
 *  intentionally rather than imported: this module must compile standalone
 *  even if Fase B has not landed yet in the branch this runs against. If
 *  Fase B's lib/essential-words/attempt-grade.ts already exists when this
 *  task is implemented, prefer importing its Grade type here instead of
 *  this local alias, to guarantee the two never drift. Check before writing
 *  this file for real. */
export type Grade = "Again" | "Hard" | "Good" | "Easy";

export interface FsrsScheduleInput {
  stability: number;
  difficulty: number;
  state: FsrsCardState;
  grade: Grade;
  /** Reference instant for `dueAt`. Defaults to the current date. */
  now?: Date;
}

export interface FsrsScheduleResult {
  stability: number;
  difficulty: number;
  /** Whole days until the card is next due, derived from ts-fsrs's due date. */
  interval: number;
  dueAt: Date;
  state: FsrsCardState;
}

const GRADE_TO_RATING: Record<Grade, FsrsRating> = {
  Again: Rating.Again as FsrsRating,
  Hard: Rating.Hard as FsrsRating,
  Good: Rating.Good as FsrsRating,
  Easy: Rating.Easy as FsrsRating,
};

const STATE_TO_FSRS: Record<FsrsCardState, State> = {
  New: State.New, Learning: State.Learning, Review: State.Review, Relearning: State.Relearning,
};

const FSRS_TO_STATE: Record<State, FsrsCardState> = {
  [State.New]: "New", [State.Learning]: "Learning",
  [State.Review]: "Review", [State.Relearning]: "Relearning",
};

const DAY_MS = 86_400_000;

// Standard ts-fsrs default parameters — unmodified, so a future optimizer
// (spec §8, out of scope this phase) can be run against the review log
// later without a mismatch between what generated the data and what would
// tune it.
const params = generatorParameters();
const scheduler = fsrs(params);

export function scheduleFsrsReview(input: FsrsScheduleInput): FsrsScheduleResult {
  const now = input.now ?? new Date();

  const card: Card = {
    due: now,
    stability: input.stability,
    difficulty: input.difficulty,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: 0,
    lapses: 0,
    state: STATE_TO_FSRS[input.state],
    last_review: undefined,
  };

  const rating = GRADE_TO_RATING[input.grade];
  const { card: nextCard } = scheduler.next(card, now, rating);

  const intervalDays = Math.max(
    1,
    Math.round((nextCard.due.getTime() - now.getTime()) / DAY_MS),
  );

  return {
    stability: nextCard.stability,
    difficulty: nextCard.difficulty,
    interval: intervalDays,
    dueAt: nextCard.due,
    state: FSRS_TO_STATE[nextCard.state],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/srs/__tests__/fsrs-schedule.test.ts`
Expected: PASS.

Run: `pnpm type-check`
Expected: exit 0. If `ts-fsrs`'s actual type exports differ subtly from what's assumed above (e.g. `Grade`'s exact exported name), adjust only the import line and the `GRADE_TO_RATING`/`STATE_TO_FSRS` maps — never change `FsrsScheduleInput`/`FsrsScheduleResult`'s public shape to work around a library type mismatch.

- [ ] **Step 5: Commit**

```bash
git add lib/srs/fsrs-schedule.ts lib/srs/__tests__/fsrs-schedule.test.ts
git commit -m "feat(srs): add pure FSRS scheduler wrapper around ts-fsrs (spec §3.1/§3.5)"
```

---

### Task 5: `lib/srs/fsrs-optimizer-eligibility.ts` — `fsrsRealReviews` lifecycle

**Files:**
- Create: `lib/srs/fsrs-optimizer-eligibility.ts`
- Test: `lib/srs/__tests__/fsrs-optimizer-eligibility.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/srs/__tests__/fsrs-optimizer-eligibility.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isEligibleForOptimizer, nextFsrsRealReviews } from "../fsrs-optimizer-eligibility";

describe("isEligibleForOptimizer — spec §3.2 fsrsRealReviews lifecycle", () => {
  it("excludes a review taken while fsrsRealReviews < 3", () => {
    expect(isEligibleForOptimizer({ isRepair: false, fsrsRealReviews: 0 })).toBe(false);
    expect(isEligibleForOptimizer({ isRepair: false, fsrsRealReviews: 2 })).toBe(false);
  });

  it("includes a review taken once fsrsRealReviews reaches 3 or more", () => {
    expect(isEligibleForOptimizer({ isRepair: false, fsrsRealReviews: 3 })).toBe(true);
    expect(isEligibleForOptimizer({ isRepair: false, fsrsRealReviews: 10 })).toBe(true);
  });

  it("treats a missing fsrsRealReviews (never-migrated card) as already eligible", () => {
    expect(isEligibleForOptimizer({ isRepair: false, fsrsRealReviews: undefined })).toBe(true);
  });

  it("excludes any repair-tagged row regardless of fsrsRealReviews (spec §2.2: repairs never carry a clean grade)", () => {
    expect(isEligibleForOptimizer({ isRepair: true, fsrsRealReviews: 10 })).toBe(false);
  });
});

describe("nextFsrsRealReviews", () => {
  it("starts a freshly migrated card at 0 and increments by 1 per real review", () => {
    expect(nextFsrsRealReviews(undefined, { isRepair: false })).toBe(1);
    expect(nextFsrsRealReviews(0, { isRepair: false })).toBe(1);
    expect(nextFsrsRealReviews(1, { isRepair: false })).toBe(2);
    expect(nextFsrsRealReviews(2, { isRepair: false })).toBe(3);
  });

  it("does not increment on a repair attempt", () => {
    expect(nextFsrsRealReviews(1, { isRepair: true })).toBe(1);
  });

  it("keeps counting past 3 rather than freezing (harmless, useful for audit)", () => {
    expect(nextFsrsRealReviews(3, { isRepair: false })).toBe(4);
    expect(nextFsrsRealReviews(5, { isRepair: false })).toBe(6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/srs/__tests__/fsrs-optimizer-eligibility.test.ts`
Expected: FAIL — cannot resolve `../fsrs-optimizer-eligibility`.

- [ ] **Step 3: Write the implementation**

Create `lib/srs/fsrs-optimizer-eligibility.ts`:

```ts
/**
 * fsrsRealReviews lifecycle (Fase C, spec §3.2).
 *
 * A migrated card's initial (stability, difficulty) — see fsrs-migrate.ts —
 * is an INVENTED estimate, not a measurement. Its first few reviews are
 * observations against a stability nobody actually measured, so they would
 * poison an FSRS parameter optimizer trained on the review log. Every
 * review of a migrated card is excluded from the optimizer until it
 * accumulates 3 real reviews of its own; from then on the flag no longer
 * applies (the card behaves like any other).
 *
 * A card created fresh under FSRS (never migrated from SM-2) has no
 * fsrsRealReviews counter at all — `undefined` is treated as "already
 * eligible", not "0 reviews so far", because there is no invented state to
 * protect against.
 *
 * These functions take plain, minimal input shapes (not the full Dexie
 * SRSRatingEventRecord type) so they compile and test standalone regardless
 * of whether Fase A's review-log schema has landed yet in this branch.
 */

const MIGRATION_NOISE_THRESHOLD = 3;

/**
 * A row is eligible for the optimizer when:
 *   - it is not a repair attempt (spec §2.2 — repair rows never carry a
 *     clean recall signal, independent of migration status), AND
 *   - fsrsRealReviews is either absent (never migrated) or >= 3.
 */
export function isEligibleForOptimizer(row: {
  isRepair: boolean;
  fsrsRealReviews?: number;
}): boolean {
  if (row.isRepair) return false;
  const count = row.fsrsRealReviews;
  return count === undefined || count >= MIGRATION_NOISE_THRESHOLD;
}

/**
 * Pure counter-increment for fsrsRealReviews. Repair attempts (spec §2.2)
 * do not advance the counter. Keeps counting past the threshold rather than
 * freezing at 3 — harmless, and useful for audit/debugging.
 */
export function nextFsrsRealReviews(
  current: number | undefined,
  review: { isRepair: boolean },
): number {
  const base = current ?? 0;
  return review.isRepair ? base : base + 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/srs/__tests__/fsrs-optimizer-eligibility.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/srs/fsrs-optimizer-eligibility.ts lib/srs/__tests__/fsrs-optimizer-eligibility.test.ts
git commit -m "feat(srs): add fsrsRealReviews optimizer-eligibility predicate (spec §3.2)"
```

---

### Task 6: `lib/essential-words/graduation-grade.ts` — graduation grade from performance

**Files:**
- Create: `lib/essential-words/graduation-grade.ts`
- Test: `lib/essential-words/__tests__/graduation-grade.test.ts`

> **Check before writing:** does `lib/essential-words/attempt-grade.ts` already exist (Fase B)? If yes, import its `Grade` type here instead of redefining it — do not let two `Grade` unions drift. If Fase B has not landed, define `Grade` locally in this file exactly as `lib/srs/fsrs-schedule.ts` (Task 4) does, and add a one-line comment flagging it for reconciliation once Fase B lands.

- [ ] **Step 1: Write the failing test**

Create `lib/essential-words/__tests__/graduation-grade.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { graduationGrade, LOW_LATENCY_MS } from "../graduation-grade";

describe("graduationGrade — spec §3.4: mode is a ceiling, not an assignment", () => {
  it("no hints, low latency, cloze_sentence -> Easy", () => {
    expect(
      graduationGrade({ hintsUsed: 0, latencyMs: LOW_LATENCY_MS - 1, mode: "cloze_sentence" }),
    ).toBe("Easy");
  });

  it("no hints, low latency, dictation_sentence -> Easy — SAME ceiling as cloze_sentence", () => {
    // define_to_word was cut from scope (spec §1.5), so dictation_sentence
    // is the floor of the production chain, not a degraded mode. It must
    // NOT be capped below Easy — that was the exact bug an earlier draft
    // of this rule introduced by letting mode assign the grade directly.
    expect(
      graduationGrade({ hintsUsed: 0, latencyMs: LOW_LATENCY_MS - 1, mode: "dictation_sentence" }),
    ).toBe("Easy");
  });

  it("latency not low -> Good, even with zero hints and cloze_sentence", () => {
    expect(
      graduationGrade({ hintsUsed: 0, latencyMs: LOW_LATENCY_MS + 1, mode: "cloze_sentence" }),
    ).toBe("Good");
  });

  it("any hints used -> Good, regardless of latency or mode", () => {
    expect(graduationGrade({ hintsUsed: 1, latencyMs: 500, mode: "cloze_sentence" })).toBe("Good");
  });

  it("speak_sentence (not full production) -> Good even with no hints and low latency", () => {
    expect(
      graduationGrade({ hintsUsed: 0, latencyMs: LOW_LATENCY_MS - 1, mode: "speak_sentence" }),
    ).toBe("Good");
  });

  it("recall_translation (recognition/recall tier, not production) -> Good even with no hints and low latency", () => {
    expect(
      graduationGrade({ hintsUsed: 0, latencyMs: LOW_LATENCY_MS - 1, mode: "recall_translation" }),
    ).toBe("Good");
  });

  it("never returns Again or Hard — this is only called on a graduating (successful) attempt", () => {
    const modes = ["cloze_sentence", "dictation_sentence", "speak_sentence", "recall_translation"] as const;
    for (const mode of modes) {
      for (const hintsUsed of [0, 1, 3]) {
        expect(["Easy", "Good"]).toContain(graduationGrade({ hintsUsed, latencyMs: 1000, mode }));
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/essential-words/__tests__/graduation-grade.test.ts`
Expected: FAIL — cannot resolve `../graduation-grade`.

- [ ] **Step 3: Write the implementation**

Create `lib/essential-words/graduation-grade.ts`:

```ts
/**
 * Graduation grade from performance (Fase C, spec §3.4).
 *
 * "El modo no asigna el grado: lo limita." Performance decides the grade;
 * mode only gates whether Easy is reachable at all.
 *
 * "Producción completa" is the cloze_sentence -> dictation_sentence chain
 * (spec §1.6) — with define_to_word cut from scope, dictation_sentence is
 * the FLOOR of that chain, not a degraded mode. Both modes count as full
 * production and both are eligible for Easy. Do not reintroduce a ceiling
 * that excludes dictation_sentence from Easy — an earlier draft of this
 * rule made that mistake by letting content availability, rather than
 * performance, decide Good vs. Easy.
 *
 * The `mode` ceiling in this function exists for a currently-unreachable
 * future case: a hypothetical degraded mode (e.g. if define_to_word were
 * ever reconsidered, spec §8) would be excluded from FULL_PRODUCTION_MODES
 * and would therefore never reach Easy, capping at Good. With the current
 * dataset (100% cloze_sentence coverage after Fase 0) that branch never
 * executes — it exists so the rule stays correct if it ever needs to.
 *
 * Why not scale FSRS's initial-stability multiplier by mode instead: FSRS
 * has 4 initial-stability values (one per grade) baked into its parameter
 * set. Scaling them per mode would modify the model outside its own
 * parameters, and the standard optimizer (out of scope this phase, spec §8)
 * could no longer be run against the resulting log. See fsrs-schedule.ts.
 */

import type { EssentialWordMode } from "./exercise-modes";
import type { Grade } from "@/lib/srs/fsrs-schedule";

/** Modes that count as full production for graduation purposes (spec §3.4). */
const FULL_PRODUCTION_MODES: ReadonlySet<EssentialWordMode> = new Set([
  "cloze_sentence",
  "dictation_sentence",
]);

/** Threshold below which latency counts as "low" for the Easy grade (spec §2.1). */
export const LOW_LATENCY_MS = 25_000;

export interface GraduationOutcome {
  hintsUsed: number;
  latencyMs: number;
  mode: EssentialWordMode;
}

export type GraduationGrade = Extract<Grade, "Easy" | "Good">;

/**
 * Grades a word's FINAL ROUND attempt at graduation time (spec §1.4 — the
 * mixed final round decides graduation, not the last exercise inside a
 * block). Only called on a successful (correct) attempt — a failed
 * final-round attempt does not graduate the word at all, so Again/Hard are
 * not representable return values here.
 */
export function graduationGrade(outcome: GraduationOutcome): GraduationGrade {
  const isFullProduction = FULL_PRODUCTION_MODES.has(outcome.mode);
  const isClean = outcome.hintsUsed === 0 && outcome.latencyMs < LOW_LATENCY_MS;
  return isClean && isFullProduction ? "Easy" : "Good";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/graduation-grade.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Type-check**

Run: `pnpm type-check`
Expected: exit 0. If `Grade` is not exported from `lib/srs/fsrs-schedule.ts` under that exact name (Task 4 defines it there), fix the import — do not redefine a third copy of the union.

- [ ] **Step 6: Commit**

```bash
git add lib/essential-words/graduation-grade.ts lib/essential-words/__tests__/graduation-grade.test.ts
git commit -m "feat(essential-words): add graduation-grade — mode as ceiling, not assignment (spec §3.4)"
```

---

### Task 7: Write-path convergence — `lib/essential-words/grade.ts`

**Files:**
- Modify: `lib/essential-words/grade.ts`
- Modify: `lib/essential-words/__tests__/grade.test.ts`

- [ ] **Step 1: Read the existing test file's mock setup in full**

Before writing anything, read `lib/essential-words/__tests__/grade.test.ts` to confirm its exact `dbMocks` shape (`getSRSData`/`saveSRSData`/`saveAttempt`/`updateDailyProgress`/`updateUserStats` mocking pattern) and its `USER_ID` fixture constant name. The tests below assume these exist under those names — adjust to match the file's actual names if they differ.

- [ ] **Step 2: Write the failing test additions**

Append inside the existing `describe("gradeEssentialWord", ...)` block (keep all existing tests — every non-scheduling side effect must survive unchanged):

```ts
it("migrates a legacy SM-2 entry to FSRS fields on first FSRS-routed grade", async () => {
  dbMocks.getSRSData.mockResolvedValue({
    wordId: "c1k:to", word: "to", ease: 2.5, interval: 10,
    repetitions: 2, nextReview: "2026-08-10T00:00:00Z", lastReview: "2026-08-01T00:00:00Z",
  } satisfies SRSData);
  await gradeEssentialWord("to", 4, {}, USER_ID);
  const saved = dbMocks.saveSRSData.mock.calls[0][0] as SRSData;
  expect(saved.stability).toBeGreaterThan(0);
  expect(saved.difficulty).toBeGreaterThanOrEqual(1);
  expect(saved.difficulty).toBeLessThanOrEqual(10);
  expect(saved.state).toBeDefined();
});

it("increments fsrsRealReviews from 0 on a card's first FSRS review after migration", async () => {
  dbMocks.getSRSData.mockResolvedValue({
    wordId: "c1k:to", word: "to", ease: 2.5, interval: 10,
    repetitions: 2, nextReview: "2026-08-10T00:00:00Z", lastReview: "2026-08-01T00:00:00Z",
    stability: 10, difficulty: 3, state: "Review", fsrsRealReviews: 0,
  } satisfies SRSData);
  await gradeEssentialWord("to", 4, {}, USER_ID);
  const saved = dbMocks.saveSRSData.mock.calls[0][0] as SRSData;
  expect(saved.fsrsRealReviews).toBe(1);
});

it("advances nextReview into the future via the FSRS scheduler", async () => {
  await gradeEssentialWord("to", 4, {}, USER_ID);
  const saved = dbMocks.saveSRSData.mock.calls[0][0] as SRSData;
  expect(new Date(saved.nextReview).getTime()).toBeGreaterThan(Date.now());
});

it("still persists attempt/XP/stats side effects unchanged on the speak path (FSRS routing does not touch them)", async () => {
  await gradeEssentialWord("to", 4, { accuracy: 90, transcript: "to the store" }, USER_ID);
  expect(dbMocks.saveAttempt).toHaveBeenCalledOnce();
  expect(dbMocks.updateDailyProgress).toHaveBeenCalledOnce();
  expect(dbMocks.updateUserStats).toHaveBeenCalledOnce();
});
```

- [ ] **Step 3: Run test to verify the new tests fail**

Run: `npx vitest run lib/essential-words/__tests__/grade.test.ts`
Expected: FAIL on the new FSRS-specific assertions (`saved.stability`/`saved.fsrsRealReviews` are `undefined`); the pre-existing tests should still PASS.

- [ ] **Step 4: Migrate the implementation**

Replace the full contents of `lib/essential-words/grade.ts`:

```ts
// Single write path for grading a Core 1000 card. Both the speak flow
// (quality derived from accuracy) and the self-grade fallback land here, so
// FSRS state can never diverge between the two.

import { deriveFsrsState } from "@/lib/srs/fsrs-migrate";
import { scheduleFsrsReview, type Grade } from "@/lib/srs/fsrs-schedule";
import { nextFsrsRealReviews } from "@/lib/srs/fsrs-optimizer-eligibility";
import { calculateXP } from "@/lib/pronunciation/scoring";
import {
  getSRSData, saveSRSData, saveAttempt, updateDailyProgress, updateUserStats,
} from "@/lib/db";
import { essentialWordId } from "./types";
import { savePracticeAnswer } from "@/lib/practice/queries";
import type { SRSData } from "@/lib/types";

export interface GradeExtras {
  /** Accuracy 0–100 del scoring hablado. Ausente en self-grade. */
  accuracy?: number;
  transcript?: string;
}

/**
 * Maps a legacy 0-5 quality into an FSRS Grade, for callers that have not
 * yet moved to Fase B's AttemptOutcome -> Grade pipeline (attempt-grade.ts).
 * The speak-path (quality from accuracyToQuality) and the self-grade
 * fallback both still call gradeEssentialWord with a numeric quality, so
 * this bridge keeps them working under the FSRS scheduler without changing
 * their call sites.
 */
function qualityToGrade(quality: number): Grade {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  if (q <= 2) return "Again";
  if (q === 3) return "Hard";
  if (q === 4) return "Good";
  return "Easy";
}

function withFsrsState(
  current: SRSData,
  now: Date,
): Required<Pick<SRSData, "stability" | "difficulty" | "state" | "fsrsRealReviews">> {
  if (current.stability !== undefined && current.difficulty !== undefined && current.state !== undefined) {
    return {
      stability: current.stability,
      difficulty: current.difficulty,
      state: current.state,
      fsrsRealReviews: current.fsrsRealReviews ?? 0,
    };
  }
  // Fresh-start migration (spec §3.2): no retroactive recompute.
  const derived = deriveFsrsState(current, now);
  return {
    stability: derived.stability,
    difficulty: derived.difficulty,
    state: current.repetitions > 0 ? "Review" : "New",
    fsrsRealReviews: 0,
  };
}

export async function gradeEssentialWord(
  word: string,
  quality: number,
  extras: GradeExtras = {},
  userId?: string,
): Promise<void> {
  const normalized = word.toLowerCase();
  const wordId = essentialWordId(normalized);

  if (!userId) return;
  const now = new Date();
  const current: SRSData = (await getSRSData(wordId, userId)) ?? {
    wordId, word: normalized, ease: 2.5, interval: 0, repetitions: 0,
    nextReview: now.toISOString(),
  };

  const fsrsState = withFsrsState(current, now);
  const grade = qualityToGrade(quality);
  const scheduled = scheduleFsrsReview({
    stability: fsrsState.stability,
    difficulty: fsrsState.difficulty,
    state: fsrsState.state,
    grade,
    now,
  });

  const next: SRSData = {
    ...current,
    stability: scheduled.stability,
    difficulty: scheduled.difficulty,
    state: scheduled.state,
    fsrsRealReviews: nextFsrsRealReviews(fsrsState.fsrsRealReviews, { isRepair: false }),
    nextReview: scheduled.dueAt.toISOString(),
    lastReview: now.toISOString(),
    repetitions: current.repetitions + (grade === "Again" ? 0 : 1),
  };
  await saveSRSData(next, userId);

  // Solo el camino hablado alimenta attempts/XP; el self-grade no inventa accuracy.
  if (extras.accuracy !== undefined) {
    const xp = calculateXP(extras.accuracy);
    await saveAttempt({
      word: normalized,
      lessonId: "essential-words",
      transcript: extras.transcript ?? "",
      accuracy: extras.accuracy,
      isCorrect: extras.accuracy >= 70,
      timestamp: new Date().toISOString(),
    }, userId);
    await updateDailyProgress(extras.accuracy, normalized, xp, userId);
    await updateUserStats(extras.accuracy, xp, userId);
  }

  // Write to answer_history so Core 1000 progress shows in streak/accuracy charts.
  if (userId) {
    try {
      await savePracticeAnswer(userId, {
        exerciseId: wordId,
        exerciseTypeId: extras.accuracy !== undefined ? 10 : 5, // speak_word : fill_blank
        slug: extras.accuracy !== undefined ? 'speak_word' : 'fill_blank',
        isCorrect: quality >= 3,
        userAnswer: extras.transcript,
        contentId: wordId,
        context: 'essential-words',
        timeMs: 0,
      })
    } catch {
      // Best-effort — never break the grading flow for a logging failure.
    }
  }
}
```

> This drops the previous `createSRSEntry`/`updateSRS` import (both from `@/lib/srs`) entirely — `gradeEssentialWord` no longer calls SM-2. `repetitions` is retained as a legacy display field, incremented heuristically (non-Again grades advance it) — it no longer drives scheduling.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/essential-words/__tests__/grade.test.ts`
Expected: PASS, all tests (existing + 4 new).

- [ ] **Step 6: Confirm no regressions in dependent essential-words tests**

Run: `npx vitest run lib/essential-words`
Expected: PASS. If any test asserts on `ease`/`interval` fields written by `gradeEssentialWord` specifically (not just reading `SRSData` generically), that's expected fallout from an intentional scheduling change — fix the assertion to check `stability`/`difficulty`/`nextReview` instead, do not weaken the production code to satisfy a stale expectation.

- [ ] **Step 7: Commit**

```bash
git add lib/essential-words/grade.ts lib/essential-words/__tests__/grade.test.ts
git commit -m "feat(essential-words): route gradeEssentialWord through FSRS scheduler (spec §3.1)"
```

---

### Task 8: Write-path convergence — `lib/practice/fragment-srs.ts`

**Files:**
- Modify: `lib/practice/fragment-srs.ts`
- Modify: `lib/practice/__tests__/fragment-srs.test.ts`

- [ ] **Step 1: Read the existing test file's mock setup in full**

As with Task 7 Step 1, confirm the exact `dbMocks` names before writing new assertions.

- [ ] **Step 2: Write the failing test additions**

Append inside the existing `describe("upsertFragmentSrs", ...)` block:

```ts
it("migrates a legacy SM-2 entry to FSRS fields on first FSRS-routed grade", async () => {
  dbMocks.getSRSData.mockResolvedValue({
    wordId: "fragment:abc-123", word: "fragment:abc-123", ease: 2.5, interval: 5,
    repetitions: 1, nextReview: "2026-08-09T00:00:00.000Z", lastReview: "2026-08-01T00:00:00.000Z",
  } satisfies SRSData);
  await upsertFragmentSrs("abc-123", 5);
  const saved = dbMocks.saveSRSData.mock.calls[0][0] as SRSData;
  expect(saved.stability).toBeGreaterThan(0);
  expect(saved.difficulty).toBeGreaterThanOrEqual(1);
  expect(saved.state).toBeDefined();
  expect(saved.fsrsRealReviews).toBe(1);
});

it("uses the same FSRS scheduler as gradeEssentialWord — converges on the same SRSData shape", async () => {
  await upsertFragmentSrs("abc-123", 4);
  const saved = dbMocks.saveSRSData.mock.calls[0][0] as SRSData;
  expect(saved.wordId).toBe("fragment:abc-123");
  expect(typeof saved.stability).toBe("number");
  expect(typeof saved.difficulty).toBe("number");
});
```

- [ ] **Step 3: Run test to verify the new tests fail**

Run: `npx vitest run lib/practice/__tests__/fragment-srs.test.ts`
Expected: FAIL on the new assertions; pre-existing tests still PASS.

- [ ] **Step 4: Migrate the implementation**

Replace the full contents of `lib/practice/fragment-srs.ts`:

```ts
import { deriveFsrsState } from "@/lib/srs/fsrs-migrate";
import { scheduleFsrsReview, type Grade } from "@/lib/srs/fsrs-schedule";
import { nextFsrsRealReviews } from "@/lib/srs/fsrs-optimizer-eligibility";
import { getSRSData, saveSRSData } from "@/lib/db";
import type { SRSData } from "@/lib/types";

/**
 * Namespace prefix for text_fragment SRS rows in Dexie's `srsData` table.
 * Mirrors the Core 1000 `c1k:` convention (lib/essential-words/types.ts) so a single
 * Dexie store holds multiple SRS domains keyed by string id.
 */
const FRAGMENT_SRS_PREFIX = "fragment:";

/** Namespaced Dexie key for a text_fragments row. */
export function fragmentSrsId(fragmentId: string): string {
  return `${FRAGMENT_SRS_PREFIX}${fragmentId}`;
}

/**
 * Maps a legacy 0-5 quality into an FSRS Grade. Deliberately duplicated
 * (not shared) from lib/essential-words/grade.ts's identical helper: the
 * two call sites are allowed to diverge on this numeric-compatibility
 * mapping independently in the future without coordinating, since it is
 * the FSRS scheduler call underneath (spec §3.1) that must converge, not
 * this shim on top of it.
 */
function qualityToGrade(quality: number): Grade {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  if (q <= 2) return "Again";
  if (q === 3) return "Hard";
  if (q === 4) return "Good";
  return "Easy";
}

function withFsrsState(
  current: SRSData,
  now: Date,
): Required<Pick<SRSData, "stability" | "difficulty" | "state" | "fsrsRealReviews">> {
  if (current.stability !== undefined && current.difficulty !== undefined && current.state !== undefined) {
    return {
      stability: current.stability,
      difficulty: current.difficulty,
      state: current.state,
      fsrsRealReviews: current.fsrsRealReviews ?? 0,
    };
  }
  const derived = deriveFsrsState(current, now);
  return {
    stability: derived.stability,
    difficulty: derived.difficulty,
    state: current.repetitions > 0 ? "Review" : "New",
    fsrsRealReviews: 0,
  };
}

/**
 * Apply an FSRS review to the local SRS state for a system `text_fragments`
 * sentence. These fragments are system content (`user_id = null`), so their
 * per-user review state lives client-side in Dexie rather than in a Supabase
 * per-user table — offline-first by construction. Mirrors `gradeEssentialWord`
 * (spec §3.1: both write paths converge on lib/srs/fsrs-schedule.ts).
 *
 * `quality` is the 0–5 legacy grade, mapped to an FSRS Grade internally.
 */
export async function upsertFragmentSrs(
  fragmentId: string,
  quality: number,
): Promise<void> {
  const id = fragmentSrsId(fragmentId);
  const now = new Date();
  const current: SRSData = (await getSRSData(id)) ?? {
    wordId: id, word: id, ease: 2.5, interval: 0, repetitions: 0,
    nextReview: now.toISOString(),
  };

  const fsrsState = withFsrsState(current, now);
  const grade = qualityToGrade(quality);
  const scheduled = scheduleFsrsReview({
    stability: fsrsState.stability,
    difficulty: fsrsState.difficulty,
    state: fsrsState.state,
    grade,
    now,
  });

  const next: SRSData = {
    ...current,
    stability: scheduled.stability,
    difficulty: scheduled.difficulty,
    state: scheduled.state,
    fsrsRealReviews: nextFsrsRealReviews(fsrsState.fsrsRealReviews, { isRepair: false }),
    nextReview: scheduled.dueAt.toISOString(),
    lastReview: now.toISOString(),
    repetitions: current.repetitions + (grade === "Again" ? 0 : 1),
  };
  await saveSRSData(next);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/practice/__tests__/fragment-srs.test.ts`
Expected: PASS, all tests.

- [ ] **Step 6: Confirm no regressions in dependent practice tests**

Run: `npx vitest run lib/practice`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/practice/fragment-srs.ts lib/practice/__tests__/fragment-srs.test.ts
git commit -m "feat(practice): route upsertFragmentSrs through FSRS scheduler, converging with essential-words (spec §3.1)"
```

---

### Task 9: Backward-compatibility verification across all `SRSData` readers

**Files:** none new — verification-only.

- [ ] **Step 1: Enumerate every file that imports `SRSData`**

Run: `grep -rl "SRSData" --include="*.ts" --include="*.tsx" lib components hooks | sort`

Expected: a list of files. Keep it for reference — it is not committed as a file.

- [ ] **Step 2: Run the full test suite for every module in that list**

Run: `npx vitest run lib components hooks`
Expected: PASS, zero new failures relative to before this phase. Every new `SRSData` field is optional, so this should be a clean pass with no code changes required.

If a test fails:
- A failure asserting exact equality against a full `SRSData` object literal (`toEqual({...})` instead of `toMatchObject({...})`) needs the four new optional fields added to its expected literal — this is expected fallout from an additive interface change, fix the assertion.
- Any failure inside `components/vocabulary/decks/` (the declared-out-of-scope path, Task 0) is unexpected and must be investigated immediately — that path does not import `SRSData` at all, so a failure there indicates something broader broke, not scoped fallout from this plan.

- [ ] **Step 3: Confirm `pnpm type-check` and `pnpm lint` are clean**

Run: `pnpm type-check`
Run: `pnpm lint`
Expected: both exit 0.

- [ ] **Step 4: Record the verification**

```bash
git commit --allow-empty -m "$(cat <<'EOF'
test(srs): verify backward compatibility across all SRSData readers post-FSRS migration

Confirmed the additive-only change to SRSData (lib/types.ts) does not
break any file that only reads SRSData for its SM-2 fields. Full
lib/components/hooks suite green; deck_entry_progress path
(components/vocabulary/decks/study-utils.ts) confirmed untouched — it
never imported SRSData (spec §3.1 permanent exception).
EOF
)"
```

---

## Self-Review

**Spec §3 requirement-to-task mapping:**

| Spec item | Task |
|---|---|
| §3.1 write-path convergence | Tasks 7, 8 route both `gradeEssentialWord` and `upsertFragmentSrs` through the same `lib/srs/fsrs-schedule.ts`; Task 0 documents the `deck_entry_progress` exception with the spec's own reasoning |
| §3.2 migration model (fresh-start, corrected stability/difficulty formula, `fsrsRealReviews` lifecycle) | Tasks 2, 3, 5; consumed by Tasks 7, 8 |
| §3.3 review log | Consumed, not built, by this plan — the log's schema is Fase A's responsibility. `isEligibleForOptimizer` (Task 5) reads a plain-object shape so it compiles independent of Fase A's exact Dexie type |
| §3.4 graduation grade | Task 6, with an explicit test proving `dictation_sentence` reaches Easy identically to `cloze_sentence` — the exact regression an earlier draft of this rule introduced |
| §3.5 `ts-fsrs` dependency | Task 1, pinned exact version `5.4.1`, verified present on the npm registry and its real API (not assumed) confirmed against the installed package's type definitions before writing Task 4 |
| §7.4 invariant 14 (`fsrsRealReviews < 3` excluded from optimizer) | Task 5, unit-tested as a pure predicate. Per spec, this invariant is verified against the real log, not in CI — no integration/E2E task added for it here |

**Correction versus an earlier draft of this plan, worth stating explicitly:** a prior pass at this plan assumed `ts-fsrs`'s `FSRS.next()` might return a rating-keyed `RecordLog` requiring a lookup by grade. Verified directly against the installed `ts-fsrs@5.4.1` package's `dist/index.d.ts`: `.next(card, now, grade)` takes the grade as a direct third argument and returns a single `RecordLogItem = { card, log }` — no lookup needed. `Card`'s exact field list (including `learning_steps`, not present in an earlier draft's assumed shape) was also verified against the same file before Task 4 was written.

**Placeholder-pattern scan:** no `TODO`, `TBD`, "similar to above", or "add appropriate handling" strings in any task's code. Task 6's note about `Grade`'s source (Fase B vs. local fallback) is an explicit, actionable check-before-writing instruction, not an unresolved placeholder left in code.

**Type/signature consistency check:**
- `stability`/`difficulty` derivation formula (Task 2's `deriveFsrsState`) is called directly (not reimplemented) by Tasks 7 and 8's `withFsrsState` — copy-paste risk avoided by import, not restatement.
- `Grade` (`'Again' | 'Hard' | 'Good' | 'Easy'`) is defined once in Task 4 (`lib/srs/fsrs-schedule.ts`) with an explicit note that Fase B's `attempt-grade.ts` should be preferred if it already exists; Task 6 imports `Grade` from Task 4's module rather than redefining a third copy.
- `qualityToGrade` appears in both Task 7 and Task 8 as intentionally separate, identical-shape local functions — documented explicitly in Task 8's docstring as a deliberate non-shared shim (only the underlying `scheduleFsrsReview` call must converge, not this bridge).
- `withFsrsState`'s return shape (`stability`, `difficulty`, `state`, `fsrsRealReviews`, all required) is identical in Tasks 7 and 8.

---

## Verification

- [ ] `pnpm type-check` passes with zero errors
- [ ] `pnpm lint` passes with zero errors
- [ ] `npx vitest run lib/srs lib/essential-words lib/practice` passes, zero failures
- [ ] `npx vitest run lib components hooks` (full backward-compat sweep, Task 9) passes, zero regressions
- [ ] `git log --oneline -10` shows all commits from Tasks 1–9 on the current branch
- [ ] Manual spot-check: `gradeEssentialWord` and `upsertFragmentSrs` no longer import `updateSRS`/`createSRSEntry` from `@/lib/srs`
- [ ] Manual spot-check: `git diff main -- components/vocabulary/decks/study-utils.ts` is empty

**This phase is what finally moves scheduling off SM-2.** After Task 8, every write to `SRSData` (essential-words and journal fragments) goes through `lib/srs/fsrs-schedule.ts`, not `lib/srs/schedule.ts`. `lib/srs/schedule.ts` itself is **not deleted** — it remains permanently in use by `components/vocabulary/decks/study-utils.ts` for `deck_entry_progress`, **by design, not by omission** (spec §3.1). Any future work touching `deck_entry_progress` scheduling should stay on SM-2 unless a separate, explicitly-scoped plan decides otherwise.
