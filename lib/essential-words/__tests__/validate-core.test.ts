import { describe, expect, it } from "vitest";
import { normalizeIpaForCompare, validateEntry } from "../validate-core";
import type { EssentialWord } from "../types";

const to: EssentialWord = {
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

describe("example_sentences variants", () => {
  it("accepts variants that contain the word", () => {
    const issues = validateEntry({
      ...to,
      example_sentences: [
        { sentence: "I want to eat now.", sentence_ipa: "/aɪ wɑnt tu it naʊ/" },
      ],
    });
    expect(issues).toEqual([]);
  });

  it("flags a variant that does not contain the word", () => {
    const issues = validateEntry({
      ...to,
      example_sentences: [
        { sentence: "A totally unrelated line.", sentence_ipa: "/ə laɪn/" },
      ],
    });
    expect(issues.map((i) => i.kind)).toContain("variant-missing-word");
  });

  it("flags a variant identical to the base sentence", () => {
    const issues = validateEntry({
      ...to,
      example_sentences: [
        { sentence: to.example_sentence, sentence_ipa: "/dup/" },
      ],
    });
    expect(issues.map((i) => i.kind)).toContain("variant-duplicate");
  });
});

describe("study content references", () => {
  const study = {
    pronunciation: {
      soundAnchors: [{ id: "schwa", ipa: "/ə/", explanationEs: "como una vocal relajada" }],
      variants: [{
        id: "before_consonant_sound",
        labelEs: "Antes de sonido de consonante",
        ipa: "/tə/",
        spokenExample: "**to** school",
        anchorIds: ["schwa"],
      }],
    },
    examples: [{
      english: "I go **to** school.",
      translationEs: "Voy a la escuela.",
      variantId: "before_consonant_sound",
    }],
  };

  it("accepts linked, compilable study content", () => {
    expect(validateEntry({ ...to, study })).toEqual([]);
  });

  it("flags unknown references and uncovered pronunciation variants", () => {
    const issues = validateEntry({
      ...to,
      study: {
        ...study,
        pronunciation: {
          ...study.pronunciation,
          variants: [{ ...study.pronunciation.variants[0], anchorIds: ["missing"] }],
        },
        examples: [{ ...study.examples[0], variantId: "unknown" }],
      },
    });
    expect(issues.map((issue) => issue.kind)).toEqual(expect.arrayContaining([
      "study-unknown-anchor",
      "study-unknown-variant",
      "study-missing-variant-example",
    ]));
  });

  it("flags invalid markup and missing explanations for non-template contrasts", () => {
    const issues = validateEntry({
      ...to,
      study: {
        examples: [{ english: "I **go to school.", translationEs: "Voy a la escuela." }],
        contrasts: {
          titleEs: "No se traduce literalmente",
          pairs: [{ pattern: "replacement", spanish: "Depende **de** ti", english: "It depends **on** you" }],
        },
      },
    });
    expect(issues.map((issue) => issue.kind)).toEqual(expect.arrayContaining([
      "study-markup",
      "study-missing-explanation",
    ]));
  });

  it("flags a study rule id that is not in the shared catalogue", () => {
    const issues = validateEntry({
      ...to,
      study: { usage: { ruleId: "invented_rule" } },
    });
    expect(issues.map((issue) => issue.kind)).toContain("study-unknown-rule");
  });
});
