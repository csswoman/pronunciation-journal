import { describe, expect, it } from "vitest";
import { deriveUsageLifecycle } from "../skill-item";
import type { ItemSchedule, LearningItem, UsagePayload } from "../verification/types";

const payload = (over: Partial<UsagePayload> = {}): UsagePayload => ({
  usageKind: "advanced_usage",
  expression: "depend on",
  sentence: "It depends on the weather.",
  acceptedVariants: [],
  generationStatus: "ready",
  metadata: { schemaVersion: 1 },
  ...over,
});

const usage = (schedule: ItemSchedule, over: Partial<UsagePayload> = {}): LearningItem => ({
  id: "c1k:on#usage:depend-on",
  wordId: "c1k:on",
  skill: "usage",
  contentOrigin: "generated",
  generatorProvider: "gemini",
  payload: payload(over),
  schedule,
  repetitions: 0,
  lapses: 0,
  suspended: false,
});

describe("deriveUsageLifecycle", () => {
  it("sin programación es inactive", () => {
    expect(deriveUsageLifecycle(usage({ kind: "none" }))).toBe("inactive");
  });

  it("con programación FSRS es active", () => {
    expect(deriveUsageLifecycle(usage({
      kind: "fsrs",
      dueAt: "2026-08-20T00:00:00.000Z",
      stability: 5,
      difficulty: 5,
      state: "Learning",
    }))).toBe("active");
  });

  it("con programación provisional es active", () => {
    expect(deriveUsageLifecycle(usage({
      kind: "provisional",
      dueAt: "2026-08-20T00:00:00.000Z",
      source: "direct",
      evidenceConfidence: 1,
    }))).toBe("active");
  });

  it("retiredAt gana sobre cualquier programación", () => {
    const retired = usage(
      {
        kind: "fsrs",
        dueAt: "2026-08-20T00:00:00.000Z",
        stability: 5,
        difficulty: 5,
        state: "Review",
      },
      { retiredAt: "2026-08-05T00:00:00.000Z" },
    );
    expect(deriveUsageLifecycle(retired)).toBe("retired");
  });

  it("no puede haber estado contradictorio: el ciclo sale de schedule, no de un enum", () => {
    const inactive = usage({ kind: "none" });
    const active = usage({
      kind: "fsrs",
      dueAt: "2026-08-20T00:00:00.000Z",
      stability: 5,
      difficulty: 5,
      state: "Learning",
    });
    expect(deriveUsageLifecycle(inactive)).not.toBe(deriveUsageLifecycle(active));
  });
});
