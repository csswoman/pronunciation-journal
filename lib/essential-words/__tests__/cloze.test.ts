import { describe, expect, it } from "vitest";
import { clozeFor } from "../cloze";
import type { EssentialWord } from "../types";

function entry(overrides: Partial<EssentialWord> = {}): EssentialWord {
  return {
    rank: 1,
    word: "through",
    pos: "preposition",
    ipa_strong: "/θruː/",
    example_sentence: "We walked through the park yesterday morning.",
    cefr_level: "A1",
    meaning: "from one side to the other",
    translation: "a través de",
    ...overrides,
  };
}

describe("clozeFor", () => {
  it("blanks the exact word and returns it as the answer", () => {
    const result = clozeFor(entry());
    expect(result).not.toBeNull();
    expect(result!.blanked).toBe("We walked ___ the park yesterday morning.");
    expect(result!.answer).toBe("through");
  });

  it("blanks an inflected form and returns the surface token, not the lemma", () => {
    const e = entry({
      word: "work",
      example_sentence: "She works at a hospital downtown every single day.",
    });
    const result = clozeFor(e);
    expect(result).not.toBeNull();
    expect(result!.blanked).toBe("She ___ at a hospital downtown every single day.");
    expect(result!.answer).toBe("works");
  });

  it("strips trailing punctuation from the answer token", () => {
    const e = entry({
      word: "park",
      example_sentence: "The children played happily in the beautiful green park.",
    });
    const result = clozeFor(e);
    expect(result).not.toBeNull();
    expect(result!.answer).toBe("park");
  });

  it("returns null when the word is not in the sentence", () => {
    const e = entry({ example_sentence: "A completely unrelated sentence here." });
    expect(clozeFor(e)).toBeNull();
  });

  it("returns null when the blanked sentence lacks context", () => {
    // Tras el hueco quedan casi solo function words → sin contexto para adivinar.
    const e = entry({ word: "cat", example_sentence: "It is a cat." });
    expect(clozeFor(e)).toBeNull();
  });

  it("blanks an explicitly supplied sentence instead of the entry's own", () => {
    const e = entry();
    const result = clozeFor(e, "She walked through a long dark tunnel today.");
    expect(result?.blanked).toContain("___");
    expect(result?.blanked).not.toContain("park");
    expect(result?.answer).toBe("through");
  });

  it("falls back to the entry's sentence when none is supplied", () => {
    const e = entry();
    expect(clozeFor(e)?.blanked).toBe(clozeFor(e, e.example_sentence)?.blanked);
  });
});
