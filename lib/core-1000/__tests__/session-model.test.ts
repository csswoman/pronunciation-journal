import { describe, expect, it } from "vitest";
import {
  advanceSummary,
  buildCore1000ExerciseResult,
  phaseForCore1000Item,
} from "../session-model";
import type { Core1000QueueItem } from "../queue";

const item: Core1000QueueItem = {
  kind: "review",
  entry: {
    rank: 1,
    word: "test",
    pos: "noun",
    ipa_strong: "test",
    example_sentence: "This is a test.",
    cefr_level: "A1",
  },
};

describe("core 1000 session model", () => {
  it("maps item kind to phase", () => {
    expect(phaseForCore1000Item({ ...item, kind: "new" })).toBe("study");
    expect(phaseForCore1000Item(item)).toBe("speak");
  });

  it("builds exercise results for speech and text grades", () => {
    expect(buildCore1000ExerciseResult(item, 4, { accuracy: 88, transcript: "test" })).toMatchObject({
      slug: "speak_word",
      exerciseTypeId: 10,
      isCorrect: true,
      userAnswer: "test",
      score: 88,
      contentId: "c1k:test",
    });

    expect(buildCore1000ExerciseResult(item, 2)).toMatchObject({
      slug: "fill_blank",
      exerciseTypeId: 5,
      isCorrect: false,
      contentId: "c1k:test",
    });
  });

  it("advances session summary", () => {
    expect(advanceSummary(null, true)).toEqual({ practiced: 1, correct: 1 });
    expect(advanceSummary({ practiced: 3, correct: 2 }, false)).toEqual({ practiced: 4, correct: 2 });
  });
});
