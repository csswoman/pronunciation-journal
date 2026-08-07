import { describe, expect, it } from "vitest";
import type {
  AttemptEventType,
  AttemptLog,
  SrsReviewEvent,
} from "../../verification/types";
import { observedRetentionWithinTarget } from "../criteria";

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

function event(source: AttemptLog): SrsReviewEvent {
  return {
    id: `event-${source.id}`,
    attemptLogId: source.id,
    learningItemId: `${source.wordId}#meaning`,
    grade: source.assessment.grade,
    assessment: source.assessment,
    priorSchedule: { kind: "none" },
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
): { attempts: AttemptLog[]; events: SrsReviewEvent[] } {
  const attempts = Array.from({ length: total }, (_, index) => (
    attempt(index, index < correct, eventType)
  ));
  return { attempts, events: attempts.map(event) };
}

describe("observedRetentionWithinTarget", () => {
  it("criterio 11 pasa dentro del objetivo y falla con retención baja", () => {
    const passing = reviewSample(100, 90);
    const failing = reviewSample(100, 55);

    expect(observedRetentionWithinTarget(
      passing.attempts,
      passing.events,
      0.9,
      0.05,
      50,
    )).toMatchObject({ passed: true, measured: 0.9 });
    expect(observedRetentionWithinTarget(
      failing.attempts,
      failing.events,
      0.9,
      0.05,
      50,
    )).toMatchObject({ passed: false, measured: 0.55 });
  });

  it("devuelve insufficient sample y no declara éxito", () => {
    const sample = reviewSample(20, 18);
    const result = observedRetentionWithinTarget(
      sample.attempts,
      sample.events,
      0.9,
      0.05,
      50,
    );

    expect(result).toMatchObject({ passed: false, measured: 20, limit: 50 });
    expect(result.detail).toContain("insufficient sample");
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
