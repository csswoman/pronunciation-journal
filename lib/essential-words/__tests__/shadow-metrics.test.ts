import { describe, expect, it } from "vitest";
import {
  compareShadowMetrics,
  InMemoryShadowMetricsSink,
  normalizeShadowError,
  summarizeSkillDailyPlan,
} from "../shadow-metrics";
import type { DailyPlan } from "../planning-types";

describe("shadow metrics agregadas", () => {
  it("calcula diferencias skill - legacy", () => {
    const comparison = compareShadowMetrics(
      "2026-08-08T10:00:00.000Z",
      { queueSize: 8, estimatedSeconds: 240, dueCount: 5 },
      {
        queueSize: 11,
        estimatedSeconds: 300,
        dueCount: 7,
        mandatorySelected: 4,
        deferredMandatory: 3,
        baseSkillActivations: 2,
        usageActivations: 1,
        mode: "recovery",
      },
      4.5,
    );

    expect(comparison.differences).toEqual({
      queueSize: 3,
      estimatedSeconds: 60,
      dueCount: 2,
    });
    expect(comparison.computeMs).toBe(4.5);
  });

  it("resume DailyPlan sin copiar ids ni contenido", () => {
    const plan = {
      allowance: {
        plannedSeconds: 125,
        baseSkillActivations: 2,
        usageActivations: 1,
        mode: "normal",
      },
      mandatorySelected: [{ itemId: "secret-item" }],
      deferredMandatory: [{ itemId: "secret-deferred" }, { itemId: "secret-2" }],
      baseSkillSelected: [{ itemId: "secret-base" }, { itemId: "secret-base-2" }],
      usageSelected: [{ itemId: "secret-usage" }],
      newWordsSelected: [{ wordId: "secret-word" }],
      placementSelected: [],
    } as unknown as DailyPlan;

    expect(summarizeSkillDailyPlan(plan)).toEqual({
      queueSize: 5,
      estimatedSeconds: 125,
      dueCount: 3,
      mandatorySelected: 1,
      deferredMandatory: 2,
      baseSkillActivations: 2,
      usageActivations: 1,
      mode: "normal",
    });
  });

  it("comparison no puede contener ids, respuestas, audio ni texto pedagógico", () => {
    const comparison = compareShadowMetrics(
      "2026-08-08T10:00:00.000Z",
      { queueSize: 1, estimatedSeconds: 10, dueCount: 1 },
      {
        queueSize: 1,
        estimatedSeconds: 12,
        dueCount: 1,
        mandatorySelected: 1,
        deferredMandatory: 0,
        baseSkillActivations: 0,
        usageActivations: 0,
        mode: "normal",
      },
      1,
    );
    const serialized = JSON.stringify(comparison);
    for (const forbidden of [
      "wordId", "itemId", "answer", "response", "audio", "sentence", "phrase", "transcript",
    ]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
    expect(normalizeShadowError(
      new Error("wordId=c1k:on answer=private audio=https://private"),
    )).toBe("Error:skill_compute_failed");
  });

  it("sink in-memory guarda únicamente comparisons agregadas", () => {
    const sink = new InMemoryShadowMetricsSink();
    const comparison = compareShadowMetrics(
      "2026-08-08T10:00:00.000Z",
      { queueSize: 0, estimatedSeconds: 0, dueCount: 0 },
      null,
      -1,
      ["Error: skill failed"],
    );
    sink.record(comparison);
    expect(sink.comparisons).toEqual([comparison]);
    expect(comparison.computeMs).toBe(0);
    expect(comparison.differences).toBeNull();
  });
});
