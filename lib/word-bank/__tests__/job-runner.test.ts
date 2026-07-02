import { describe, expect, it } from "vitest";
import { buildEnrichmentFailurePlan } from "@/lib/word-bank/job-runner";

describe("buildEnrichmentFailurePlan", () => {
  it("requeues recoverable enrichment failures with visible processing state", () => {
    const now = Date.UTC(2026, 0, 1, 0, 0, 0);
    const plan = buildEnrichmentFailurePlan(1, new Error("provider timeout"), now);

    expect(plan).toMatchObject({
      exhausted: false,
      wordStatus: "processing",
      wordErrorReason: "retry_scheduled",
      jobStatus: "queued",
      lastError: "provider timeout",
    });
    expect(plan.runAfter).toBe("2026-01-01T00:01:00.000Z");
  });

  it("marks exhausted enrichment failures as failed for retry UI", () => {
    const now = Date.UTC(2026, 0, 1, 0, 0, 0);
    const plan = buildEnrichmentFailurePlan(3, "unknown", now);

    expect(plan).toMatchObject({
      exhausted: true,
      wordStatus: "failed",
      wordErrorReason: "enrichment_failed",
      jobStatus: "failed",
      lastError: "enrichment_failed",
      runAfter: "2026-01-01T00:00:00.000Z",
    });
  });
});
