import { describe, expect, it } from "vitest";
import type { LearnerLevelResolution } from "@/lib/learner-level/core";
import { C2_PACK_NOTE, formatPackBytes, suggestPackLevel } from "../pack-level-suggestion";

function resolution(overrides: Partial<LearnerLevelResolution>): LearnerLevelResolution {
  return { level: "A2", source: "placement", confidence: null, isPlaced: true, updatedAt: null, ...overrides };
}

describe("suggestPackLevel", () => {
  it("waits while the level is loading", () => {
    expect(suggestPackLevel(null, true)).toEqual({ kind: "loading" });
  });

  it("suggests the canonical level when it is known", () => {
    expect(suggestPackLevel(resolution({ level: "A2" }), false)).toEqual({
      kind: "suggested",
      level: "A2",
      note: null,
    });
  });

  it("asks the learner to pick when the source is unknown, never defaulting to A1", () => {
    expect(suggestPackLevel(resolution({ level: "A1", source: "unknown" }), false)).toEqual({ kind: "unknown" });
  });

  it("asks the learner to pick when the level read produced nothing", () => {
    expect(suggestPackLevel(null, false)).toEqual({ kind: "unknown" });
  });

  it("suggests a labelled C1 pack for C2 learners", () => {
    expect(suggestPackLevel(resolution({ level: "C2" }), false)).toEqual({
      kind: "suggested",
      level: "C1",
      note: C2_PACK_NOTE,
    });
  });
});

describe("formatPackBytes", () => {
  it("formats bytes as megabytes with one decimal", () => {
    expect(formatPackBytes(3_200_802)).toMatch(/^3[.,]1 MB$/);
  });
});
