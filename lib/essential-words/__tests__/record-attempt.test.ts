import { describe, expect, it } from "vitest";
import { planAttemptRecord } from "../record-attempt";
import type { ExecutionContext } from "../execution-context";
import type { AttemptAssessment, LearningItem } from "../verification/types";

const NOW = new Date("2026-08-06T10:00:00.000Z");

const context = (ids: string[]): ExecutionContext => ({
  now: NOW,
  newId: () => {
    const id = ids.shift();
    if (!id) throw new Error("test exhausted ids");
    return id;
  },
});

const assessment = (
  grade: AttemptAssessment["grade"] = "Easy",
): AttemptAssessment => ({
  grade,
  modality: "production",
  correct: grade !== "Again",
  latencyMs: 3_000,
  interactionDurationMs: 9_000,
  usedHints: grade === "Hard",
  rescued: false,
  acceptedVariant: false,
  firstTryFailed: false,
  freeAudioReplays: 0,
});

const item = (skill: "meaning" | "production" | "listening"): LearningItem => ({
  id: `c1k:on#${skill}`,
  wordId: "c1k:on",
  skill,
  contentOrigin: "authored",
  schedule: { kind: "none" },
  repetitions: 0,
  lapses: 0,
  suspended: false,
});

const input = (overrides: Partial<Parameters<typeof planAttemptRecord>[0]> = {}) => ({
  wordId: "c1k:on",
  sessionId: "session-1",
  assessment: assessment(),
  eventType: "verification" as const,
  currentItems: [item("meaning"), item("production")],
  ...overrides,
});

describe("planAttemptRecord", () => {
  it("producción Easy produce un intento y dos efectos", () => {
    const plan = planAttemptRecord(input(), context(["attempt-1", "event-1", "event-2"]));

    expect(plan.attemptLog.id).toBe("attempt-1");
    expect(plan.attemptLog.occurredAt).toBe(NOW.toISOString());
    expect(plan.srsEvents).toHaveLength(2);
    expect(plan.updatedItems).toHaveLength(2);
    expect(plan.srsEvents.map((event) => event.learningItemId).sort()).toEqual([
      "c1k:on#meaning",
      "c1k:on#production",
    ]);
    expect(plan.srsEvents.every((event) => event.attemptLogId === plan.attemptLog.id)).toBe(true);
  });

  it("practice registra telemetría sin efectos SRS", () => {
    const plan = planAttemptRecord(input({ eventType: "practice" }), context(["attempt-practice"]));

    expect(plan.attemptLog.eventType).toBe("practice");
    expect(plan.attemptLog.observations).toHaveLength(2);
    expect(plan.srsEvents).toHaveLength(0);
    expect(plan.updatedItems).toHaveLength(0);
  });

  it("Again conserva schedules y aumenta lapses solo en ítems observados", () => {
    const plan = planAttemptRecord(input({
      assessment: assessment("Again"),
      eventType: "scheduled-review",
      currentItems: [item("meaning"), item("production"), item("listening")],
    }), context(["attempt", "meaning-event", "production-event"]));

    expect(plan.updatedItems.map((updated) => updated.skill).sort()).toEqual(["meaning", "production"]);
    expect(plan.updatedItems.every((updated) => updated.lapses === 1)).toBe(true);
    for (const event of plan.srsEvents) {
      expect(event.priorSchedule.kind).toBe("none");
      expect(event.resultingSchedule.kind).toBe("fsrs");
      expect(event.grade).toBe("Again");
    }
  });

  it("no atribuye todos los efectos al primer ítem", () => {
    const plan = planAttemptRecord(input({
      assessment: assessment("Good"),
      eventType: "scheduled-review",
    }), context(["attempt", "event-1", "event-2"]));

    expect(new Set(plan.srsEvents.map((event) => event.learningItemId)).size).toBe(2);
  });

  it("el mismo contexto produce IDs y fechas reproducibles", () => {
    const first = planAttemptRecord(input(), context(["attempt", "event-1", "event-2"]));
    const second = planAttemptRecord(input(), context(["attempt", "event-1", "event-2"]));

    expect(second).toEqual(first);
  });

  it("ninguna actualización persiste estado derivado", () => {
    const plan = planAttemptRecord(input({
      assessment: assessment("Good"),
      eventType: "scheduled-review",
    }), context(["attempt", "event-1", "event-2"]));

    for (const updated of plan.updatedItems) {
      expect(updated).not.toHaveProperty("status");
      expect(updated).not.toHaveProperty("mature");
      expect(updated).not.toHaveProperty("learningReason");
    }
  });
});
