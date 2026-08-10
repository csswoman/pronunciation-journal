import { describe, expect, it } from "vitest";
import { sentenceVariants, selectProductionClozeSentence, selectSentence } from "../sentence-variants";
import type { EssentialWord } from "../types";

function entry(overrides: Partial<EssentialWord> = {}): EssentialWord {
  return {
    rank: 1,
    word: "want",
    pos: "verb",
    ipa_strong: "/wɑnt/",
    example_sentence: "I want to go home.",
    sentence_ipa: "/aɪ wɑnt tu ɡoʊ hoʊm/",
    cefr_level: "A1",
    ...overrides,
  };
}

const withTwo = entry({
  example_sentences: [
    { sentence: "We want more time.", sentence_ipa: "/wi wɑnt mɔr taɪm/" },
    { sentence: "They want a new car.", sentence_ipa: "/ðeɪ wɑnt ə nu kɑr/" },
  ],
});

describe("sentenceVariants", () => {
  it("returns the base sentence as the only variant when none are authored", () => {
    expect(sentenceVariants(entry())).toEqual([
      { sentence: "I want to go home.", sentence_ipa: "/aɪ wɑnt tu ɡoʊ hoʊm/" },
    ]);
  });

  it("puts the base sentence first, then the authored variants", () => {
    expect(sentenceVariants(withTwo).map((v) => v.sentence)).toEqual([
      "I want to go home.",
      "We want more time.",
      "They want a new car.",
    ]);
  });

  it("tolerates a missing sentence_ipa on the base entry", () => {
    const bare = entry({ sentence_ipa: undefined });
    expect(sentenceVariants(bare)[0].sentence_ipa).toBeUndefined();
  });
});

describe("selectSentence", () => {
  it("returns the base sentence when there are no variants", () => {
    expect(selectSentence(entry(), 0).sentence).toBe("I want to go home.");
    expect(selectSentence(entry(), 7).sentence).toBe("I want to go home.");
  });

  it("is deterministic: same word and repetitions give the same sentence", () => {
    expect(selectSentence(withTwo, 3)).toEqual(selectSentence(withTwo, 3));
  });

  it("cycles through every variant as repetitions advance", () => {
    const seen = new Set<string>();
    for (let reps = 0; reps <= 8; reps++) {
      seen.add(selectSentence(withTwo, reps).sentence);
    }
    expect(seen.size).toBe(3);
  });

  it("never returns a variant with an empty sentence", () => {
    for (let reps = 0; reps <= 20; reps++) {
      expect(selectSentence(withTwo, reps).sentence.length).toBeGreaterThan(0);
    }
  });

  it("treats a negative or fractional repetitions count as 0", () => {
    expect(selectSentence(withTwo, -1)).toEqual(selectSentence(withTwo, 0));
    expect(selectSentence(withTwo, 2.7)).toEqual(selectSentence(withTwo, 2));
  });
});

describe("selectProductionClozeSentence", () => {
  it("skips an editorially excluded synonym-ambiguous variant", () => {
    const program = entry({
      word: "program",
      pos: "noun",
      example_sentence: "The program starts Monday.",
      example_sentences: [
        { sentence: "The TV program will start soon.", sentence_ipa: "/ðə tiːviː proʊɡræm wɪl stɑrt suːn/" },
      ],
    });

    for (let repetitions = 0; repetitions < 6; repetitions++) {
      expect(selectProductionClozeSentence(program, repetitions)?.sentence)
        .toBe("The program starts Monday.");
    }
  });
});
