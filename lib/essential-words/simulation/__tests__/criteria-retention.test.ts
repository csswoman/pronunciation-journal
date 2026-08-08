import { describe, expect, it } from "vitest";
import type {
  AttemptEventType,
  AttemptLog,
  ItemSchedule,
  SrsReviewEvent,
} from "../../verification/types";
import {
  observedRetention,
  observedRetentionWithinTarget,
} from "../criteria";

function attempt(
  index: number,
  correct: boolean,
  eventType: AttemptEventType = "scheduled-review",
): AttemptLog {
  return {
    id: `attempt-${eventType}-${index}`,
    sessionId: `session-${index}`,
    wordId: `c1k:word-${index}`,
    assessment: {
      grade: correct ? "Good" : "Again",
      modality: "recognition",
      correct,
      latencyMs: 2_000,
      interactionDurationMs: 4_000,
      usedHints: false,
      rescued: false,
      acceptedVariant: false,
      firstTryFailed: false,
      freeAudioReplays: 0,
    },
    observations: [],
    eventType,
    occurredAt: "2026-08-01T00:00:00.000Z",
  };
}

const REVIEW_SCHEDULE: ItemSchedule = {
  kind: "fsrs",
  dueAt: "2026-08-01T00:00:00.000Z",
  stability: 10,
  difficulty: 5,
  state: "Review",
};

function event(
  source: AttemptLog,
  priorSchedule: ItemSchedule = REVIEW_SCHEDULE,
  suffix = "",
): SrsReviewEvent {
  return {
    id: `event-${source.id}${suffix}`,
    attemptLogId: source.id,
    learningItemId: `${source.wordId}#meaning`,
    grade: source.assessment.grade,
    assessment: source.assessment,
    priorSchedule,
    resultingSchedule: {
      kind: "fsrs",
      dueAt: "2026-08-02T00:00:00.000Z",
      stability: 1,
      difficulty: 5,
      state: "Review",
    },
    occurredAt: source.occurredAt,
    affectsSchedule: true,
    fsrsAudit: { schedulerVersion: "test", desiredRetention: 0.9 },
  };
}

function reviewSample(
  total: number,
  correct: number,
  eventType: AttemptEventType = "scheduled-review",
  startIndex = 0,
): { attempts: AttemptLog[]; events: SrsReviewEvent[] } {
  const attempts = Array.from({ length: total }, (_, index) => (
    attempt(startIndex + index, index < correct, eventType)
  ));
  return { attempts, events: attempts.map((source) => event(source)) };
}

describe("observedRetentionWithinTarget", () => {
  it("criterio 11 acepta el intervalo cerrado y falla por debajo o por encima", () => {
    const passing = reviewSample(100, 90);
    const tooLow = reviewSample(100, 55);
    const tooHigh = reviewSample(100, 100);

    expect(observedRetentionWithinTarget(
      passing.attempts,
      passing.events,
      0.9,
      0.05,
      50,
    )).toMatchObject({ passed: true, measured: 0.9 });
    expect(observedRetentionWithinTarget(
      tooLow.attempts,
      tooLow.events,
      0.9,
      0.05,
      50,
    )).toMatchObject({ passed: false, measured: 0.55 });
    expect(observedRetentionWithinTarget(
      tooHigh.attempts,
      tooHigh.events,
      0.9,
      0.05,
      50,
    )).toMatchObject({ passed: false, measured: 1 });
  });

  it("devuelve insufficient sample y no declara éxito", () => {
    const sample = reviewSample(49, 44);
    const result = observedRetentionWithinTarget(
      sample.attempts,
      sample.events,
      0.9,
      0.05,
      50,
    );

    expect(result).toMatchObject({ passed: false, measured: 49, limit: 50 });
    expect(result.detail).toContain("insufficient-data");
    expect(observedRetention(sample.attempts, sample.events, 50)).toEqual({
      status: "insufficient-data",
      sampleSize: 49,
      required: 50,
    });

    const enough = reviewSample(50, 45);
    expect(observedRetention(enough.attempts, enough.events, 50)).toEqual({
      status: "measured",
      retention: 0.9,
      sampleSize: 50,
    });
  });

  it("cuenta una vez cada intento scheduled-review que parte de FSRS Review", () => {
    const scheduled = reviewSample(50, 45);
    const duplicatedEffects = scheduled.events.map((source) => ({
      ...source,
      id: `${source.id}-second-effect`,
      learningItemId: source.learningItemId.replace("#meaning", "#listening"),
    }));

    expect(observedRetentionWithinTarget(
      scheduled.attempts,
      [...scheduled.events, ...duplicatedEffects],
      0.9,
      0.05,
      50,
    )).toMatchObject({ passed: true, measured: 0.9 });
  });

  it("excluye verification, learning-step, practice y eventos huérfanos", () => {
    const scheduled = reviewSample(50, 45);
    const verification = reviewSample(100, 0, "verification");
    const learning = reviewSample(100, 0, "learning-step");
    const practice = reviewSample(100, 0, "practice");
    const orphan = {
      ...scheduled.events[0],
      id: "orphan-event",
      attemptLogId: "missing-attempt",
    };

    expect(observedRetentionWithinTarget(
      [
        ...scheduled.attempts,
        ...verification.attempts,
        ...learning.attempts,
        ...practice.attempts,
      ],
      [
        ...scheduled.events,
        ...verification.events,
        ...learning.events,
        ...practice.events,
        orphan,
      ],
      0.9,
      0.05,
      50,
    )).toMatchObject({ passed: true, measured: 0.9 });
  });
});
