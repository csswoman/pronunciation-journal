import { describe, expect, it } from "vitest";
import {
  isEligibleForOptimizer,
  nextFsrsRealReviews,
} from "../fsrs-optimizer-eligibility";

describe("isEligibleForOptimizer", () => {
  it("excludes a review while fsrsRealReviews is below 3", () => {
    expect(isEligibleForOptimizer({ isRepair: false, fsrsRealReviews: 0 })).toBe(false);
    expect(isEligibleForOptimizer({ isRepair: false, fsrsRealReviews: 2 })).toBe(false);
  });

  it("includes a review once fsrsRealReviews reaches 3", () => {
    expect(isEligibleForOptimizer({ isRepair: false, fsrsRealReviews: 3 })).toBe(true);
    expect(isEligibleForOptimizer({ isRepair: false, fsrsRealReviews: 10 })).toBe(true);
  });

  it("treats missing fsrsRealReviews as already eligible", () => {
    expect(isEligibleForOptimizer({ isRepair: false, fsrsRealReviews: undefined })).toBe(true);
  });

  it("excludes repair rows regardless of their counter", () => {
    expect(isEligibleForOptimizer({ isRepair: true, fsrsRealReviews: 10 })).toBe(false);
  });
});

describe("nextFsrsRealReviews", () => {
  it("starts at 0 and increments once per real review", () => {
    expect(nextFsrsRealReviews(undefined, { isRepair: false })).toBe(1);
    expect(nextFsrsRealReviews(0, { isRepair: false })).toBe(1);
    expect(nextFsrsRealReviews(1, { isRepair: false })).toBe(2);
    expect(nextFsrsRealReviews(2, { isRepair: false })).toBe(3);
  });

  it("does not increment on a repair attempt", () => {
    expect(nextFsrsRealReviews(1, { isRepair: true })).toBe(1);
  });

  it("keeps counting past 3", () => {
    expect(nextFsrsRealReviews(3, { isRepair: false })).toBe(4);
    expect(nextFsrsRealReviews(5, { isRepair: false })).toBe(6);
  });
});
