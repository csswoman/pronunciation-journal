import { describe, expect, it } from "vitest";
import type { SRSData } from "@/lib/types";

describe("SRSData FSRS fields (additive)", () => {
  it("keeps a pre-migration SRSData value valid without FSRS fields", () => {
    const legacy: SRSData = {
      wordId: "c1k:legacy",
      word: "legacy",
      ease: 2.5,
      interval: 10,
      repetitions: 2,
      nextReview: "2026-08-10T00:00:00.000Z",
    };
    expect(legacy.stability).toBeUndefined();
    expect(legacy.difficulty).toBeUndefined();
    expect(legacy.state).toBeUndefined();
    expect(legacy.fsrsRealReviews).toBeUndefined();
  });

  it("allows a migrated SRSData value to carry all FSRS fields", () => {
    const migrated: SRSData = {
      wordId: "c1k:migrated",
      word: "migrated",
      ease: 2.5,
      interval: 10,
      repetitions: 2,
      nextReview: "2026-08-10T00:00:00.000Z",
      stability: 10,
      difficulty: 3,
      state: "Review",
      fsrsRealReviews: 0,
    };
    expect(migrated.state).toBe("Review");
    expect(migrated.fsrsRealReviews).toBe(0);
  });
});
