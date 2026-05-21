import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { computeSM2, type SM2Progress } from "../compute";

// `computeSM2` is the SM2Progress-shape wrapper over `scheduleNextReview`.
// These tests cover the wrapper's responsibilities:
//   - default seed values when current === null
//   - mapping ease/interval/repetitions onto SM2Progress fields
//   - derived `status` ("learning" / "review" / "mastered")
//   - ISO timestamps for next_review_at / last_reviewed_at
//   - ease preservation on lapse (updateEaseOnLapse: false)
//
// The underlying SM-2 math is covered in schedule.test.ts; we only spot-check
// here that the wrapper passes through correctly.

const NOW = new Date("2026-01-15T00:00:00.000Z");
const DAY_MS = 86_400_000;

function makeProgress(overrides: Partial<SM2Progress> = {}): SM2Progress {
  return {
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 1,
    next_review_at: null,
    status: "learning",
    last_reviewed_at: null,
    ...overrides,
  };
}

describe("computeSM2", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("failing grades (0–2): reset and preserve ease", () => {
    it("grade 0 resets repetitions to 0 and interval to 1", () => {
      const current = makeProgress({ ease_factor: 2.4, interval_days: 12, repetitions: 4 });
      const next = computeSM2(current, 0);

      expect(next.repetitions).toBe(0);
      expect(next.interval_days).toBe(1);
      expect(next.status).toBe("learning");
    });

    it("grade 1 preserves ease factor (updateEaseOnLapse=false)", () => {
      const current = makeProgress({ ease_factor: 2.4, interval_days: 6, repetitions: 2 });
      const next = computeSM2(current, 1);

      expect(next.ease_factor).toBe(2.4);
      expect(next.repetitions).toBe(0);
    });

    it("grade 2 preserves ease factor even when below default 2.5", () => {
      const current = makeProgress({ ease_factor: 1.7, interval_days: 8, repetitions: 3 });
      const next = computeSM2(current, 2);

      expect(next.ease_factor).toBe(1.7);
      expect(next.interval_days).toBe(1);
    });
  });

  describe("grade 3 (minimum passing)", () => {
    it("on first review: interval=1, repetitions=1, status=review", () => {
      const next = computeSM2(null, 3);

      expect(next.interval_days).toBe(1);
      expect(next.repetitions).toBe(1);
      // status is "learning" only while repetitions=0; the first passing review
      // bumps repetitions to 1, so it flips straight to "review".
      expect(next.status).toBe("review");
      // grade=3 with default ease 2.5 yields ease - 0.14 = 2.36
      expect(next.ease_factor).toBe(2.36);
    });

    it("on second review: interval=6, status=review", () => {
      const current = makeProgress({ ease_factor: 2.5, interval_days: 1, repetitions: 1 });
      const next = computeSM2(current, 3);

      expect(next.interval_days).toBe(6);
      expect(next.repetitions).toBe(2);
      expect(next.status).toBe("review");
    });
  });

  describe("reinforcement grades (4–5)", () => {
    it("grade 4 keeps ease unchanged (formula yields 0 delta)", () => {
      const current = makeProgress({ ease_factor: 2.5, interval_days: 6, repetitions: 2 });
      const next = computeSM2(current, 4);

      expect(next.ease_factor).toBe(2.5);
      expect(next.repetitions).toBe(3);
      // interval = round(6 * 2.5) = 15
      expect(next.interval_days).toBe(15);
      expect(next.status).toBe("review");
    });

    it("grade 5 bumps ease by +0.1 and grows interval geometrically", () => {
      const current = makeProgress({ ease_factor: 2.5, interval_days: 6, repetitions: 2 });
      const next = computeSM2(current, 5);

      expect(next.ease_factor).toBe(2.6);
      expect(next.interval_days).toBe(15);
      expect(next.repetitions).toBe(3);
    });

    it("interval > 21 days flips status to mastered", () => {
      const current = makeProgress({ ease_factor: 2.6, interval_days: 15, repetitions: 3 });
      const next = computeSM2(current, 5);

      // round(15 * 2.6) = 39
      expect(next.interval_days).toBe(39);
      expect(next.status).toBe("mastered");
    });
  });

  describe("ease factor boundaries", () => {
    it("clamps ease at MIN_EASE (1.3) on repeated low grades", () => {
      // Start near the floor; grade 3 with updateEaseOnLapse=false still
      // recalculates ease because grade >= 3 takes the passing branch.
      const current = makeProgress({ ease_factor: 1.3, interval_days: 1, repetitions: 1 });
      const next = computeSM2(current, 3);

      // adjustEase(1.3, 3) = 1.3 + (0.1 - 2 * 0.12) = 1.16, clamped to 1.3
      expect(next.ease_factor).toBe(1.3);
    });

    it("preserves an already-low ease on a lapse (no recalculation)", () => {
      const current = makeProgress({ ease_factor: 1.3, interval_days: 20, repetitions: 5 });
      const next = computeSM2(current, 0);

      expect(next.ease_factor).toBe(1.3);
      expect(next.repetitions).toBe(0);
    });

    it("default ease 2.5 is used when current is null", () => {
      const next = computeSM2(null, 5);

      // adjustEase(2.5, 5) = 2.6
      expect(next.ease_factor).toBe(2.6);
    });
  });

  describe("timestamps", () => {
    it("next_review_at is interval_days from now (ISO)", () => {
      const next = computeSM2(null, 4);

      expect(next.last_reviewed_at).toBe(NOW.toISOString());
      const reviewAt = new Date(next.next_review_at!);
      const deltaDays = Math.round((reviewAt.getTime() - NOW.getTime()) / DAY_MS);
      expect(deltaDays).toBe(next.interval_days);
    });
  });
});
