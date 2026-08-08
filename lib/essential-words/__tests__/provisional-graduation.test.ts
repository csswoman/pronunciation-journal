import { describe, expect, it } from "vitest";
import { fixedExecutionContext } from "../execution-context";
import { planAttemptRecord } from "../record-attempt";
import type { AttemptAssessment, LearningItem } from "../verification/types";

const NOW = new Date("2026-08-06T10:00:00.000Z");

const assessment = (
  modality: AttemptAssessment["modality"],
  grade: AttemptAssessment["grade"],
): AttemptAssessment => ({
  grade,
  modality,
  correct: grade !== "Again",
  latencyMs: 3_000,
  interactionDurationMs: 9_000,
  usedHints: grade === "Hard",
  rescued: false,
  acceptedVariant: false,
  firstTryFailed: grade === "Again",
  freeAudioReplays: 0,
});

const provisional = (skill: "meaning" | "production"): LearningItem => ({
  id: `c1k:on#${skill}`,
  wordId: "c1k:on",
  skill,
  contentOrigin: "authored",
  schedule: {
    kind: "provisional",
    dueAt: "2026-08-06T00:00:00.000Z",
    source: "direct",
    evidenceConfidence: 1,
  },
  repetitions: 0,
  lapses: 0,
  suspended: false,
});

const plan = (
  inputAssessment: AttemptAssessment,
  currentItems: LearningItem[],
) => planAttemptRecord({
  wordId: "c1k:on",
  sessionId: "session-1",
  assessment: inputAssessment,
  eventType: "scheduled-review",
  currentItems,
}, fixedExecutionContext(NOW, ["attempt-1", "event-1", "event-2"]));

describe("graduación de provisionales", () => {
  it("Good convierte un provisional vencido en un evento FSRS real", () => {
    const result = plan(assessment("recognition", "Good"), [provisional("meaning")]);

    expect(result.srsEvents).toHaveLength(1);
    expect(result.srsEvents[0].priorSchedule.kind).toBe("provisional");
    expect(result.srsEvents[0].resultingSchedule.kind).toBe("fsrs");
    expect(result.updatedItems[0].schedule.kind).toBe("fsrs");
  });

  it("Again parte de New y conserva el estado real devuelto por FSRS", () => {
    const result = plan(assessment("recognition", "Again"), [provisional("meaning")]);
    const [event] = result.srsEvents;

    expect(event.priorSchedule.kind).toBe("provisional");
    expect(event.resultingSchedule.kind).toBe("fsrs");
    if (event.resultingSchedule.kind === "fsrs") {
      expect(event.resultingSchedule.state).not.toBe("Review");
    }
  });

  it("producción gradúa dos provisionales con eventos distintos del mismo intento", () => {
    const result = plan(assessment("production", "Good"), [
      provisional("meaning"),
      provisional("production"),
    ]);

    expect(result.srsEvents).toHaveLength(2);
    expect(result.srsEvents.every((event) => event.priorSchedule.kind === "provisional")).toBe(true);
    expect(result.srsEvents.every((event) => event.resultingSchedule.kind === "fsrs")).toBe(true);
    expect(new Set(result.srsEvents.map((event) => event.learningItemId))).toEqual(new Set([
      "c1k:on#meaning",
      "c1k:on#production",
    ]));
    expect(new Set(result.srsEvents.map((event) => event.attemptLogId))).toEqual(new Set(["attempt-1"]));
  });

  it("no inventa reviews anteriores a la interacción que graduó el provisional", () => {
    const result = plan(assessment("recognition", "Good"), [provisional("meaning")]);

    expect(result.srsEvents).toHaveLength(1);
    expect(result.srsEvents[0]).toMatchObject({
      occurredAt: NOW.toISOString(),
      priorSchedule: { kind: "provisional" },
      attemptLogId: result.attemptLog.id,
    });
  });
});
