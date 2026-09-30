import { describe, expect, it } from "vitest";
import { shouldSampleForRecheck, RECHECK_SAMPLE_RATE } from "../triage-recheck";

describe("shouldSampleForRecheck", () => {
  it("has RECHECK_SAMPLE_RATE set to approximately 1/15", () => {
    expect(RECHECK_SAMPLE_RATE).toBeCloseTo(1 / 15, 4);
  });

  it("is deterministic for the same word id", () => {
    const wordIdA = "c1k:apple";
    const wordIdB = "c1k:banana";
    expect(shouldSampleForRecheck(wordIdA)).toBe(shouldSampleForRecheck(wordIdA));
    expect(shouldSampleForRecheck(wordIdB)).toBe(shouldSampleForRecheck(wordIdB));
  });

  it("samples approximately 1/15 of words over a large synthetic sample", () => {
    const sampleSize = 1500;
    let sampledCount = 0;

    for (let i = 0; i < sampleSize; i++) {
      if (shouldSampleForRecheck(`c1k:word_${i}`)) {
        sampledCount++;
      }
    }

    // Expected ~ 100 out of 1500 (6.67%). Allowing reasonable variance (4% to 9%).
    const sampledRatio = sampledCount / sampleSize;
    expect(sampledRatio).toBeGreaterThan(0.04);
    expect(sampledRatio).toBeLessThan(0.09);
  });
});
