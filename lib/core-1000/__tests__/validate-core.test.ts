import { describe, expect, it } from "vitest";
import { normalizeIpaForCompare, sentenceContainsWord, validateEntry } from "../validate-core";
import type { CoreWord } from "../types";

const to: CoreWord = {
  rank: 4,
  word: "to",
  pos: "preposition",
  ipa_strong: "/tuː/",
  ipa_weak: "/tə/",
  example_sentence: "I want to go home.",
  sentence_ipa: "/aɪ ˈwɑnt tə ˈɡoʊ ˈhoʊm/",
  cefr_level: "A1",
};

describe("normalizeIpaForCompare", () => {
  it("strips slashes, stress and spaces; unifies r/ɹ, g/ɡ, ʌ/ə", () => {
    expect(normalizeIpaForCompare("/ˈwɔːtər/")).toBe(normalizeIpaForCompare("wɔːtəɹ"));
    expect(normalizeIpaForCompare("/ɡoʊ/")).toBe(normalizeIpaForCompare("/goʊ/"));
    expect(normalizeIpaForCompare("/ʌbaʊt/")).toBe(normalizeIpaForCompare("/əbaʊt/"));
  });
});

describe("sentenceContainsWord", () => {
  it("accepts inflected verb forms", () => {
    expect(sentenceContainsWord("She works at a hospital.", "work")).toBe(true);
    expect(sentenceContainsWord("They offered help.", "offer")).toBe(true);
  });

  it("accepts irregular be forms", () => {
    expect(sentenceContainsWord("They are happy today.", "be")).toBe(true);
  });

  it("accepts compound tokens that embed the lemma", () => {
    expect(sentenceContainsWord("See you tonight.", "night")).toBe(true);
  });

  it("rejects unrelated sentences", () => {
    expect(sentenceContainsWord("I want it.", "to")).toBe(false);
    expect(sentenceContainsWord("She went for a runner.", "run")).toBe(false);
  });
});

describe("validateEntry", () => {
  it("passes a correct weak-form entry", () => {
    // "to" is in CMUdict as T UW1 → /tuː/
    expect(validateEntry(to)).toEqual([]);
  });

  it("flags ipa_strong that disagrees with CMU", () => {
    const issues = validateEntry({ ...to, ipa_strong: "/taʊ/" });
    expect(issues.some((i) => i.kind === "ipa-mismatch")).toBe(true);
  });

  it("flags weak form on a non-whitelisted word", () => {
    const issues = validateEntry({
      ...to,
      word: "table",
      ipa_strong: "/ˈteɪbəl/",
      example_sentence: "The table is big.",
    });
    expect(issues.some((i) => i.kind === "weak-not-whitelisted")).toBe(true);
  });

  it("flags a sentence that does not contain the word", () => {
    const issues = validateEntry({ ...to, example_sentence: "I want it." });
    expect(issues.some((i) => i.kind === "sentence-missing-word")).toBe(true);
  });

  it("does not flag words missing from CMUdict", () => {
    const issues = validateEntry({
      ...to,
      word: "zzzznotaword",
      ipa_weak: undefined,
      sentence_ipa: undefined,
      example_sentence: "A zzzznotaword here.",
    });
    expect(issues.filter((i) => i.kind === "ipa-mismatch")).toEqual([]);
  });
});
