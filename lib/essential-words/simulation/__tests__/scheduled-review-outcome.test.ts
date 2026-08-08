import { describe, expect, it } from "vitest";
import type { LearningItem } from "../../verification/types";
import { PROFILES } from "../profiles";
import { seededRandom } from "../random";
import { simulateScheduledReviewOutcome } from "../scheduled-review-outcome";

const NOW = new Date("2026-08-20T00:00:00.000Z");
const REVIEW_ITEM: LearningItem = {
  id: "c1k:test#meaning",
  wordId: "c1k:test",
  skill: "meaning",
  contentOrigin: "authored",
  schedule: {
    kind: "fsrs",
    dueAt: NOW.toISOString(),
    stability: 10,
    difficulty: 5,
    state: "Review",
  },
  lastReview: "2026-08-10T00:00:00.000Z",
  repetitions: 3,
  lapses: 0,
  suspended: false,
};

function simulateSample(
  seed: number,
  total: number,
  item: LearningItem = REVIEW_ITEM,
): boolean[] {
  const random = seededRandom(seed);
  return Array.from({ length: total }, () => {
    const result = simulateScheduledReviewOutcome(item, NOW, random);
    if (!result) throw new Error("expected an eligible scheduled review");
    return result.recalled;
  });
}

describe("simulateScheduledReviewOutcome", () => {
  it("deriva una muestra amplia alrededor de desiredRetention desde retrievability", () => {
    const outcomes = simulateSample(42, 10_000);
    const observed = outcomes.filter(Boolean).length / outcomes.length;

    expect(simulateScheduledReviewOutcome(REVIEW_ITEM, NOW, seededRandom(42)))
      .toMatchObject({ retrievability: 0.9 });
    expect(observed).toBeGreaterThanOrEqual(0.85);
    expect(observed).toBeLessThanOrEqual(0.95);
  });

  it("produce exactamente la misma secuencia con la misma semilla", () => {
    expect(simulateSample(2_026, 500)).toEqual(simulateSample(2_026, 500));
  });

  it("no usa la precisión fija del perfil principiante como techo de recall", () => {
    expect(PROFILES.beginner.accuracyByModality.recognition).toBeCloseTo(0.68);

    const outcomes = simulateSample(7, 5_000);
    const observed = outcomes.filter(Boolean).length / outcomes.length;
    expect(observed).toBeGreaterThan(0.85);
    expect(observed).toBeLessThan(0.95);
  });

  it("una retrievability deliberadamente baja queda fuera de C11", () => {
    const overdue = { ...REVIEW_ITEM, lastReview: "2026-04-01T00:00:00.000Z" };
    const modeled = simulateScheduledReviewOutcome(overdue, NOW, seededRandom(42));
    const outcomes = simulateSample(42, 10_000, overdue);
    const observed = outcomes.filter(Boolean).length / outcomes.length;

    expect(modeled?.retrievability).toBeLessThan(0.85);
    expect(observed).toBeLessThan(0.85);
  });

  it("solo modela schedules FSRS en estado Review con lastReview válido", () => {
    expect(simulateScheduledReviewOutcome(
      {
        ...REVIEW_ITEM,
        schedule: {
          kind: "fsrs",
          dueAt: NOW.toISOString(),
          stability: 10,
          difficulty: 5,
          state: "Learning",
        },
      },
      NOW,
      seededRandom(1),
    )).toBeNull();
    expect(simulateScheduledReviewOutcome(
      { ...REVIEW_ITEM, lastReview: undefined },
      NOW,
      seededRandom(1),
    )).toBeNull();
  });
});
