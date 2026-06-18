import { describe, expect, it } from "vitest";
import { normalizeIpaForCompare, validateEntry } from "../validate-core";
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

  it("accepts inflected example sentences via shared eligibility logic", () => {
    const issues = validateEntry({
      rank: 67,
      word: "work",
      pos: "verb",
      ipa_strong: "/wɜːrk/",
      example_sentence: "She works at a hospital downtown.",
      cefr_level: "A1",
    });
    expect(issues.filter((i) => i.kind === "sentence-missing-word")).toEqual([]);
  });
});
