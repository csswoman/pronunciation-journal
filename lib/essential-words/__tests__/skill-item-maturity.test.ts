import { describe, expect, it } from "vitest";
import { DEFAULT_MATURITY_POLICY, isMature } from "../skill-item";
import type { ItemSchedule, LearningItem, MaturityPolicy, SrsReviewEvent } from "../verification/types";

const policy: MaturityPolicy = {
  ...DEFAULT_MATURITY_POLICY,
  minStabilityDays: 21,
  minSuccessfulReviews: 3,
  maxRecentLapses: 1,
  recentReviewWindow: 5,
};

const item = (schedule: ItemSchedule, id = "c1k:on#meaning"): LearningItem => ({
  id,
  wordId: "c1k:on",
  skill: "meaning",
  contentOrigin: "authored",
  schedule,
  repetitions: 0,
  lapses: 0,
  suspended: false,
});

const reviewSchedule = (
  stability = 21,
  state: "New" | "Learning" | "Review" | "Relearning" = "Review",
): ItemSchedule => ({
  kind: "fsrs",
  dueAt: "2026-08-20T00:00:00.000Z",
  stability,
  difficulty: 5,
  state,
});

const event = (
  id: string,
  learningItemId: string,
  grade: SrsReviewEvent["grade"],
  occurredAt: string,
  attemptLogId = `attempt-${id}`,
): SrsReviewEvent => ({
  id,
  attemptLogId,
  learningItemId,
  grade,
  assessment: {
    grade,
    modality: "recognition",
    correct: grade !== "Again",
    latencyMs: 1_000,
    interactionDurationMs: 1_000,
    usedHints: false,
    rescued: false,
    acceptedVariant: false,
    firstTryFailed: false,
    freeAudioReplays: 0,
  },
  priorSchedule: { kind: "none" },
  resultingSchedule: reviewSchedule(),
  occurredAt,
  affectsSchedule: true,
  fsrsAudit: { schedulerVersion: "test", desiredRetention: 0.9 },
});

const successfulEvents = (learningItemId = "c1k:on#meaning"): SrsReviewEvent[] => [
  event("event-1", learningItemId, "Good", "2026-08-01T00:00:00.000Z"),
  event("event-2", learningItemId, "Hard", "2026-08-02T00:00:00.000Z"),
  event("event-3", learningItemId, "Easy", "2026-08-03T00:00:00.000Z"),
];

describe("isMature", () => {
  it("nunca madura sin schedule FSRS o fuera de Review", () => {
    expect(isMature(item({ kind: "none" }), successfulEvents(), policy)).toBe(false);
    expect(isMature(item(reviewSchedule(21, "Learning")), successfulEvents(), policy)).toBe(false);
  });

  it("exige estabilidad mínima y revisiones exitosas", () => {
    expect(isMature(item(reviewSchedule(20)), successfulEvents(), policy)).toBe(false);
    expect(isMature(item(reviewSchedule()), successfulEvents().slice(0, 2), policy)).toBe(false);
    expect(isMature(item(reviewSchedule()), successfulEvents(), policy)).toBe(true);
  });

  it("solo cuenta eventos del ítem evaluado", () => {
    const events = [
      event("own", "c1k:on#meaning", "Good", "2026-08-01T00:00:00.000Z"),
      ...successfulEvents("c1k:on#production"),
    ];
    expect(isMature(item(reviewSchedule()), events, policy)).toBe(false);
  });

  it("no mezcla tarjetas cuando un intento produce dos eventos", () => {
    const events = [
      event("meaning", "c1k:on#meaning", "Good", "2026-08-01T00:00:00.000Z", "attempt-1"),
      event("production-1", "c1k:on#production", "Good", "2026-08-01T00:00:00.000Z", "attempt-1"),
      event("production-2", "c1k:on#production", "Good", "2026-08-02T00:00:00.000Z"),
      event("production-3", "c1k:on#production", "Good", "2026-08-03T00:00:00.000Z"),
    ];
    expect(isMature(item(reviewSchedule()), events, policy)).toBe(false);
  });

  it("aplica recentReviewWindow sobre eventos cronológicos del ítem", () => {
    const strictPolicy = { ...policy, maxRecentLapses: 0, recentReviewWindow: 2 };
    const events = [
      event("third", "c1k:on#meaning", "Good", "2026-08-03T00:00:00.000Z"),
      event("first", "c1k:on#meaning", "Again", "2026-08-01T00:00:00.000Z"),
      event("fourth", "c1k:on#meaning", "Good", "2026-08-04T00:00:00.000Z"),
      event("second", "c1k:on#meaning", "Good", "2026-08-02T00:00:00.000Z"),
    ];
    expect(isMature(item(reviewSchedule()), events, strictPolicy)).toBe(true);
  });

  it("demasiados Again recientes bloquean la madurez", () => {
    const events = [
      ...successfulEvents(),
      event("lapse-1", "c1k:on#meaning", "Again", "2026-08-04T00:00:00.000Z"),
      event("lapse-2", "c1k:on#meaning", "Again", "2026-08-05T00:00:00.000Z"),
    ];
    expect(isMature(item(reviewSchedule()), events, policy)).toBe(false);
  });
});
