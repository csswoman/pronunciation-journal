import { describe, it, expect } from "vitest";
import { AI_COACH_SOURCE, isFromCoach } from "../source";

describe("isFromCoach", () => {
  it("recognises a word_bank row saved by the coach", () => {
    expect(isFromCoach({ source: AI_COACH_SOURCE })).toBe(true);
  });

  it("recognises a tracked_items row saved by the coach", () => {
    expect(isFromCoach({ payload: { source: AI_COACH_SOURCE } })).toBe(true);
  });

  it("rejects a manually saved word", () => {
    expect(isFromCoach({ source: "manual" })).toBe(false);
  });

  it("rejects a row with no origin at all", () => {
    expect(isFromCoach({})).toBe(false);
  });

  it("rejects null and undefined", () => {
    expect(isFromCoach(null)).toBe(false);
    expect(isFromCoach(undefined)).toBe(false);
  });
});
