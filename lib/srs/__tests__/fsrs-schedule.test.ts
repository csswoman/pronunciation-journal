import { describe, expect, it } from "vitest";
import { scheduleFsrsReview, type FsrsScheduleInput } from "../fsrs-schedule";

const NOW = new Date("2026-08-04T00:00:00.000Z");

function baseInput(overrides: Partial<FsrsScheduleInput> = {}): FsrsScheduleInput {
  return {
    stability: 10,
    difficulty: 5,
    state: "Review",
    grade: "Good",
    now: NOW,
    ...overrides,
  };
}

describe("scheduleFsrsReview", () => {
  it("returns valid FSRS state, whole-day interval, and future due date", () => {
    const result = scheduleFsrsReview(baseInput());
    expect(result.stability).toBeGreaterThan(0);
    expect(result.difficulty).toBeGreaterThanOrEqual(1);
    expect(result.difficulty).toBeLessThanOrEqual(10);
    expect(result.interval).toBeGreaterThanOrEqual(1);
    expect(result.dueAt.getTime()).toBeGreaterThan(NOW.getTime());
    expect(result.state).toBeDefined();
  });

  it("Again produces a shorter or equal interval than Good", () => {
    const good = scheduleFsrsReview(baseInput({ grade: "Good" }));
    const again = scheduleFsrsReview(baseInput({ grade: "Again" }));
    expect(again.interval).toBeLessThanOrEqual(good.interval);
    expect(["Learning", "Relearning"]).toContain(again.state);
  });

  it("Easy produces a longer or equal interval than Good", () => {
    const good = scheduleFsrsReview(baseInput({ grade: "Good" }));
    const easy = scheduleFsrsReview(baseInput({ grade: "Easy" }));
    expect(easy.interval).toBeGreaterThanOrEqual(good.interval);
  });

  it("moves a brand-new card out of New after a Good grade", () => {
    const result = scheduleFsrsReview(
      baseInput({ state: "New", stability: 0, difficulty: 0, grade: "Good" }),
    );
    expect(result.state).not.toBe("New");
  });

  it("is deterministic for a fixed now and the default parameters", () => {
    const first = scheduleFsrsReview(baseInput());
    const second = scheduleFsrsReview(baseInput());
    expect(first).toEqual(second);
  });

  it("does not mutate the input object", () => {
    const input = baseInput();
    const snapshot = { ...input };
    scheduleFsrsReview(input);
    expect(input).toEqual(snapshot);
  });

  it("falls back to the current date when now is omitted", () => {
    const before = Date.now();
    const result = scheduleFsrsReview({
      stability: 10,
      difficulty: 5,
      state: "Review",
      grade: "Good",
    });
    expect(result.dueAt.getTime()).toBeGreaterThan(before);
  });
});
