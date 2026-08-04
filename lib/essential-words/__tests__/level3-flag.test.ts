import { describe, expect, it } from "vitest";
import { ESSENTIAL_WORDS_LEVEL3_ENABLED, gateLevel3Mode } from "../level3-flag";
import type { Step } from "../session-plan-types";

const exerciseWord = {
  rank: 1, word: "the", pos: "article" as const, ipa_strong: "/ðə/",
  example_sentence: "The end.", cefr_level: "A1" as const,
};

describe("level3-flag", () => {
  it("is a boolean constant, off by default with no env var set", () => {
    expect(typeof ESSENTIAL_WORDS_LEVEL3_ENABLED).toBe("boolean");
  });

  it("gateLevel3Mode caps a level-3 exercise step down to level 2 when the flag is off", () => {
    const step: Step = { kind: "exercise", word: exerciseWord, level: 3, mode: "cloze_sentence" };
    const result = gateLevel3Mode(step, false);
    expect(result.kind === "exercise" && result.level).toBe(2);
  });

  it("gateLevel3Mode passes level 1-2 exercise steps through unchanged regardless of the flag", () => {
    const level1: Step = { kind: "exercise", word: exerciseWord, level: 1, mode: "recognize_translation" };
    const level2: Step = { kind: "exercise", word: exerciseWord, level: 2, mode: "recall_translation" };
    expect((gateLevel3Mode(level1, false) as { level: number }).level).toBe(1);
    expect((gateLevel3Mode(level2, false) as { level: number }).level).toBe(2);
  });

  it("gateLevel3Mode passes level 3 through unchanged when the flag is on", () => {
    const step: Step = { kind: "exercise", word: exerciseWord, level: 3, mode: "cloze_sentence" };
    expect((gateLevel3Mode(step, true) as { level: number }).level).toBe(3);
  });

  it("gateLevel3Mode passes an expose step through unchanged regardless of the flag", () => {
    const step: Step = { kind: "expose", word: exerciseWord };
    expect(gateLevel3Mode(step, false)).toEqual(step);
  });
});
