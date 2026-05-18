import { describe, it, expect } from "vitest";
import { scheduleNextReview } from "../schedule";

// Cases below are derived from the two SM-2 grade-based implementations being
// unified: `updateSRS` (lib/srs.ts) and `computeSM2`/`sm2` (word-bank).
//
// lib/phoneme-practice/sr.ts is intentionally NOT covered here: it is a
// different algorithm (boolean input, 1/3/7 intervals, ±0.1/-0.2 ease capped
// at 3.0) and is deliberately left separate.
//
// Divergence handled by the `updateEaseOnLapse` flag:
//   - lib/srs.ts recalculates ease on a failed review  -> updateEaseOnLapse: true
//   - word-bank leaves ease untouched on a failed review -> updateEaseOnLapse: false

const NOW = new Date("2026-01-15T00:00:00.000Z"); // January: no DST edge cases
const DAY_MS = 86_400_000;

function daysUntil(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

describe("scheduleNextReview", () => {
  describe("first review (repetitions = 0)", () => {
    it("grade 5 sets interval to 1 day and bumps ease by +0.1", () => {
      const r = scheduleNextReview({ ease: 2.5, interval: 0, repetitions: 0, grade: 5, now: NOW });
      expect(r).toMatchObject({ ease: 2.6, interval: 1, repetitions: 1 });
      expect(daysUntil(NOW, r.nextReviewAt)).toBe(1);
    });

    it("grade 4 keeps ease unchanged (formula yields 0 delta)", () => {
      const r = scheduleNextReview({ ease: 2.5, interval: 0, repetitions: 0, grade: 4, now: NOW });
      expect(r).toMatchObject({ ease: 2.5, interval: 1, repetitions: 1 });
    });

    it("grade 3 lowers ease by 0.14", () => {
      const r = scheduleNextReview({ ease: 2.5, interval: 0, repetitions: 0, grade: 3, now: NOW });
      expect(r).toMatchObject({ ease: 2.36, interval: 1, repetitions: 1 });
    });
  });

  describe("second review (repetitions = 1)", () => {
    it("grade 5 sets interval to 6 days", () => {
      const r = scheduleNextReview({ ease: 2.6, interval: 1, repetitions: 1, grade: 5, now: NOW });
      expect(r).toMatchObject({ ease: 2.7, interval: 6, repetitions: 2 });
      expect(daysUntil(NOW, r.nextReviewAt)).toBe(6);
    });
  });

  describe("subsequent reviews (repetitions >= 2)", () => {
    it("interval = round(interval * ease) using the pre-update ease", () => {
      const r = scheduleNextReview({ ease: 2.7, interval: 6, repetitions: 2, grade: 5, now: NOW });
      // 6 * 2.7 = 16.2 -> 16
      expect(r).toMatchObject({ ease: 2.8, interval: 16, repetitions: 3 });
      expect(daysUntil(NOW, r.nextReviewAt)).toBe(16);
    });

    it("grade 3 still advances repetitions and grows the interval", () => {
      const r = scheduleNextReview({ ease: 2.5, interval: 6, repetitions: 2, grade: 3, now: NOW });
      // interval = round(6 * 2.5) = 15, ease = 2.5 - 0.14 = 2.36
      expect(r).toMatchObject({ ease: 2.36, interval: 15, repetitions: 3 });
    });
  });

  describe("failed review (grade < 3) resets repetitions and interval", () => {
    it("with updateEaseOnLapse=false (word-bank) leaves ease untouched", () => {
      const r = scheduleNextReview({
        ease: 2.5, interval: 6, repetitions: 3, grade: 2, now: NOW, updateEaseOnLapse: false,
      });
      expect(r).toMatchObject({ ease: 2.5, interval: 1, repetitions: 0 });
      expect(daysUntil(NOW, r.nextReviewAt)).toBe(1);
    });

    it("with updateEaseOnLapse=true (lib/srs.ts) recalculates ease", () => {
      const r = scheduleNextReview({
        ease: 2.5, interval: 6, repetitions: 3, grade: 2, now: NOW, updateEaseOnLapse: true,
      });
      // ease = 2.5 - 0.32 = 2.18
      expect(r).toMatchObject({ ease: 2.18, interval: 1, repetitions: 0 });
    });

    it("defaults updateEaseOnLapse to false when omitted", () => {
      const r = scheduleNextReview({ ease: 2.5, interval: 6, repetitions: 3, grade: 0, now: NOW });
      expect(r.ease).toBe(2.5);
    });
  });

  describe("ease floor of 1.3", () => {
    it("never drops below 1.3 on a heavy lapse", () => {
      const r = scheduleNextReview({
        ease: 1.5, interval: 6, repetitions: 3, grade: 0, now: NOW, updateEaseOnLapse: true,
      });
      // 1.5 - 0.8 = 0.7 -> clamped to 1.3
      expect(r.ease).toBe(1.3);
    });

    it("never drops below 1.3 on a low-grade success", () => {
      const r = scheduleNextReview({ ease: 1.4, interval: 10, repetitions: 5, grade: 3, now: NOW });
      // 1.4 - 0.14 = 1.26 -> clamped to 1.3
      expect(r.ease).toBe(1.3);
      expect(r.interval).toBe(14); // round(10 * 1.4)
    });
  });

  describe("grade normalization", () => {
    it("clamps grades above 5", () => {
      const high = scheduleNextReview({ ease: 2.5, interval: 0, repetitions: 0, grade: 7, now: NOW });
      const five = scheduleNextReview({ ease: 2.5, interval: 0, repetitions: 0, grade: 5, now: NOW });
      expect(high).toEqual(five);
    });

    it("clamps grades below 0", () => {
      const low = scheduleNextReview({ ease: 2.5, interval: 6, repetitions: 3, grade: -2, now: NOW });
      const zero = scheduleNextReview({ ease: 2.5, interval: 6, repetitions: 3, grade: 0, now: NOW });
      expect(low).toEqual(zero);
    });

    it("rounds fractional grades", () => {
      const r = scheduleNextReview({ ease: 2.5, interval: 0, repetitions: 0, grade: 4.4, now: NOW });
      expect(r.ease).toBe(2.5); // rounds to grade 4
    });
  });

  describe("purity", () => {
    it("does not mutate the input object", () => {
      const input = { ease: 2.5, interval: 6, repetitions: 2, grade: 5, now: NOW };
      scheduleNextReview(input);
      expect(input).toEqual({ ease: 2.5, interval: 6, repetitions: 2, grade: 5, now: NOW });
    });

    it("falls back to the current date when `now` is omitted", () => {
      const before = Date.now();
      const r = scheduleNextReview({ ease: 2.5, interval: 0, repetitions: 0, grade: 5 });
      const after = Date.now();
      const diff = r.nextReviewAt.getTime();
      expect(diff).toBeGreaterThanOrEqual(before + DAY_MS - 1000);
      expect(diff).toBeLessThanOrEqual(after + DAY_MS + 1000);
    });
  });
});
