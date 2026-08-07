import { describe, expect, it } from "vitest";
import { correlateLatenessWithRecall } from "../lateness-correlation";
import { runMandatoryAudit } from "../mandatory-audit";
import { PROFILES } from "../profiles";
import type { SimulationOptions } from "../state";

describe("Task 8.9f §12 — correlateLatenessWithRecall (test N)", () => {
  it("test N — sólo cuenta eventos scheduled-review/overdue-review, nunca learning-step ni provisional-due", () => {
    const correlation = correlateLatenessWithRecall([
      { itemId: "a", workKind: "scheduled-review", sessionIndex: 1, latenessSessions: 0, correct: true },
      { itemId: "b", workKind: "overdue-review", sessionIndex: 2, latenessSessions: 3, correct: false },
      { itemId: "c", workKind: "learning-step", sessionIndex: 1, latenessSessions: 0, correct: true },
      { itemId: "d", workKind: "provisional-due", sessionIndex: 1, latenessSessions: 0, correct: true },
    ]);

    expect(correlation.sampleSize).toBe(2);
    expect(correlation.retentionOnTime).toBe(1);
    expect(correlation.retentionLate).toBe(0);
  });

  it("produce p50/p95/max de lateness y % on-time sobre datos reales de un perfil de presión (intermittent)", () => {
    const options: SimulationOptions = {
      days: 90,
      corpusSize: 400,
      seed: 42,
      startAt: "2026-08-01T00:00:00.000Z",
      dailyBudgetSeconds: 900,
      targetNewWords: 10,
    };
    const audit = runMandatoryAudit(PROFILES.intermittent, options);
    const correlation = correlateLatenessWithRecall(audit.serviceEvents);

    expect(correlation.sampleSize).toBeGreaterThan(0);
    expect(correlation.latenessP95).toBeGreaterThanOrEqual(correlation.latenessP50);
    expect(correlation.latenessMax).toBeGreaterThanOrEqual(correlation.latenessP95);
    expect(correlation.onTimeSharePct).toBeGreaterThanOrEqual(0);
    expect(correlation.onTimeSharePct).toBeLessThanOrEqual(100);
    expect(correlation.buckets.reduce((total, bucket) => total + bucket.sampleSize, 0))
      .toBe(correlation.sampleSize);
  });
});
