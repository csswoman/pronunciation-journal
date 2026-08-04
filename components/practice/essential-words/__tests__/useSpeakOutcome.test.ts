import { describe, expect, it } from "vitest";
import { buildSpeakOutcome } from "../useSpeakOutcome";

describe("buildSpeakOutcome — bridges speech-scoring/self-grade paths to AttemptOutcome", () => {
  it("builds a correct outcome from a high accuracy score", () => {
    const outcome = buildSpeakOutcome({ accuracy: 92, startedAt: Date.now() - 3000 });
    expect(outcome.correct).toBe(true);
    expect(outcome.hintsUsed).toBe(0);
    expect(outcome.rescued).toBe(false);
    expect(outcome.typo).toBe(false);
    expect(outcome.latencyMs).toBeGreaterThanOrEqual(2900);
  });

  it("builds an incorrect outcome from a low accuracy score", () => {
    const outcome = buildSpeakOutcome({ accuracy: 30, startedAt: Date.now() });
    expect(outcome.correct).toBe(false);
  });

  it("builds an outcome from a manual self-grade (no mic available) — quality >= 3 counts as correct", () => {
    const outcome = buildSpeakOutcome({ selfGradeQuality: 4, startedAt: Date.now() });
    expect(outcome.correct).toBe(true);
  });

  it("a self-grade below 3 is incorrect", () => {
    const outcome = buildSpeakOutcome({ selfGradeQuality: 2, startedAt: Date.now() });
    expect(outcome.correct).toBe(false);
  });
});
