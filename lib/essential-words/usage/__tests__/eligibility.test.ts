import { describe, expect, it } from "vitest";
import { DEFAULT_MATURITY_POLICY } from "../../skill-item";
import type {
  ItemSchedule,
  LearningItem,
  MaturityPolicy,
  Skill,
  SrsReviewEvent,
} from "../../verification/types";
import { usageEligibility } from "../lifecycle";

const policy: MaturityPolicy = {
  ...DEFAULT_MATURITY_POLICY,
};

const reviewSchedule = (stability = 30): ItemSchedule => ({
  kind: "fsrs",
  dueAt: "2026-08-20T00:00:00.000Z",
  stability,
  difficulty: 5,
  state: "Review",
});

const item = (skill: Exclude<Skill, "usage">, schedule: ItemSchedule): LearningItem => ({
  id: `c1k:on#${skill}`,
  wordId: "c1k:on",
  skill,
  contentOrigin: "authored",
  schedule,
  repetitions: 0,
  lapses: 0,
  suspended: false,
});

const event = (
  id: string,
  learningItemId: string,
  occurredAt: string,
): SrsReviewEvent => ({
  id,
  attemptLogId: `attempt-${id}`,
  learningItemId,
  grade: "Good",
  assessment: {
    grade: "Good",
    modality: "recognition",
    correct: true,
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

const successfulEvents = (learningItemId: string): SrsReviewEvent[] => [
  event("event-1", learningItemId, "2026-08-01T00:00:00.000Z"),
  event("event-2", learningItemId, "2026-08-02T00:00:00.000Z"),
  event("event-3", learningItemId, "2026-08-03T00:00:00.000Z"),
  event("event-4", learningItemId, "2026-08-04T00:00:00.000Z"),
];

describe("usageEligibility", () => {
  it("habilita context usage cuando meaning está en review", () => {
    expect(usageEligibility([item("meaning", reviewSchedule())], [], policy)).toEqual({
      context_usage: true,
      advanced_usage: false,
    });
  });

  it("no habilita context usage con meaning provisional", () => {
    const meaning = item("meaning", {
      kind: "provisional",
      dueAt: "2026-08-20T00:00:00.000Z",
      source: "direct",
      evidenceConfidence: 1,
    });

    expect(usageEligibility([meaning], [], policy).context_usage).toBe(false);
  });

  it("exige meaning y production maduros para advanced usage", () => {
    const meaning = item("meaning", reviewSchedule());
    const production = item("production", reviewSchedule());
    const events = [
      ...successfulEvents(meaning.id),
      ...successfulEvents(production.id),
    ];

    expect(usageEligibility([meaning, production], events, policy)).toEqual({
      context_usage: true,
      advanced_usage: true,
    });
  });

  it("no exige listening para advanced usage", () => {
    const meaning = item("meaning", reviewSchedule());
    const production = item("production", reviewSchedule());
    const events = [
      ...successfulEvents(meaning.id),
      ...successfulEvents(production.id),
    ];

    expect(usageEligibility([meaning, production], events, policy).advanced_usage).toBe(true);
  });

  it("no cuenta eventos de otro ítem para madurar production", () => {
    const meaning = item("meaning", reviewSchedule());
    const production = item("production", reviewSchedule());
    const events = [
      ...successfulEvents(meaning.id),
      ...successfulEvents("c1k:on#listening"),
    ];

    expect(usageEligibility([meaning, production], events, policy)).toEqual({
      context_usage: true,
      advanced_usage: false,
    });
  });
});
