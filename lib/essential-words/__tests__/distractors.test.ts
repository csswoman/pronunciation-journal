import { describe, expect, it } from "vitest";
import { selectDistractors } from "../distractors";
import type { EssentialWord } from "../types";

function w(rank: number, word: string, pos: EssentialWord["pos"] = "noun"): EssentialWord {
  return { rank, word, pos, ipa_strong: `/${word}/`, example_sentence: `I see the ${word}.`, cefr_level: "A1" };
}

describe("selectDistractors — spec §2.4b policy", () => {
  it("excludes candidates at orthographic distance 1 from the target", () => {
    const target = w(1, "be", "auxiliary");
    const pool = [w(2, "he", "pronoun"), w(3, "we", "pronoun"), w(4, "cat", "noun"), w(5, "dog", "noun")];
    const result = selectDistractors(target, pool, [], 3);
    expect(result.map((r) => r.word)).not.toContain("he");
    expect(result.map((r) => r.word)).not.toContain("we");
  });

  it("prefers same grammatical category", () => {
    const target = w(1, "run", "verb");
    const pool = [w(2, "jump", "verb"), w(3, "table", "noun"), w(4, "swim", "verb")];
    const result = selectDistractors(target, pool, [], 2);
    expect(result.map((r) => r.word).sort()).toEqual(["jump", "swim"]);
  });

  it("excludes known homophones of the target", () => {
    const target = w(1, "be", "auxiliary");
    const pool = [w(2, "bee", "noun"), w(3, "cat", "noun"), w(4, "dog", "noun")];
    const result = selectDistractors(target, pool, ["bee"], 2);
    expect(result.map((r) => r.word)).not.toContain("bee");
  });

  it("dedupes by surface form (case-insensitive)", () => {
    const target = w(1, "cat", "noun");
    const pool = [w(2, "Dog", "noun"), w(3, "dog", "noun"), w(4, "bird", "noun")];
    const result = selectDistractors(target, pool, [], 3);
    const lower = result.map((r) => r.word.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });

  it("relaxes category before distance when the pool is too small under strict filtering", () => {
    // Only cross-category candidates available, none at unsafe distance.
    const target = w(1, "run", "verb");
    const pool = [w(2, "table", "noun"), w(3, "chair", "noun")];
    const result = selectDistractors(target, pool, [], 2);
    expect(result.length).toBe(2); // relaxed category, still respects distance/homophone
  });

  it("never returns the target itself even if present in the pool", () => {
    const target = w(1, "cat", "noun");
    const pool = [target, w(2, "dog", "noun"), w(3, "bird", "noun")];
    const result = selectDistractors(target, pool, [], 2);
    expect(result.map((r) => r.word)).not.toContain("cat");
  });

  it("returns fewer than requested when the pool genuinely cannot supply enough safe candidates", () => {
    const target = w(1, "cat", "noun");
    const pool = [w(2, "bat", "noun")]; // distance 1 from "cat" — excluded
    const result = selectDistractors(target, pool, [], 3);
    expect(result.length).toBe(0);
  });
});
