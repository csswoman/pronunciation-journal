import { describe, expect, it } from "vitest";
import { buildHintLadder } from "../hint-ladder";
import type { EssentialWord } from "../types";

function word(overrides: Partial<EssentialWord> = {}): EssentialWord {
  return {
    rank: 1, word: "happy", pos: "adjective", ipa_strong: "/ˈhæpi/",
    example_sentence: "She feels happy today.", cefr_level: "A1",
    meaning: "feeling good", translation: "feliz",
    ...overrides,
  };
}

describe("buildHintLadder — length-aware (spec §2.3)", () => {
  it("a >=5-letter word gets 4 rungs: category, audio, first-letter, reveal", () => {
    const ladder = buildHintLadder(word({ word: "happy" }), "cloze_sentence");
    expect(ladder.map((r) => r.kind)).toEqual(["category", "audio", "firstLetter", "reveal"]);
  });

  it("a 2-4 letter word gets 3 rungs, no letter count in category and no firstLetter rung", () => {
    const ladder = buildHintLadder(word({ word: "to", pos: "preposition" }), "cloze_sentence");
    expect(ladder.map((r) => r.kind)).toEqual(["category", "audio", "reveal"]);
  });

  it("category rung for a short word omits the letter count", () => {
    const ladder = buildHintLadder(word({ word: "to", pos: "preposition" }), "cloze_sentence");
    const category = ladder.find((r) => r.kind === "category")!;
    expect(category.content).not.toMatch(/\d+ letras/);
  });

  it("category rung for a long word includes the letter count", () => {
    const ladder = buildHintLadder(word({ word: "happy", pos: "adjective" }), "cloze_sentence");
    const category = ladder.find((r) => r.kind === "category")!;
    expect(category.content).toMatch(/5 letras/);
  });

  it("no rung's content ever equals the target word itself (no rung gives the full answer)", () => {
    for (const mode of ["cloze_sentence", "dictation_sentence", "dictation_word", "recall_translation"] as const) {
      const ladder = buildHintLadder(word({ word: "happy" }), mode);
      for (const rung of ladder) {
        if (rung.kind === "reveal") continue; // reveal is the explicit give-up rung, exempt by design
        expect(rung.content.toLowerCase()).not.toBe("happy");
      }
    }
  });

  it("reveal always counts as a fail — priced is false is WRONG for reveal; reveal is a distinct terminal rung, never priced (it's a give-up, not a hint)", () => {
    const ladder = buildHintLadder(word({ word: "happy" }), "cloze_sentence");
    const reveal = ladder.find((r) => r.kind === "reveal")!;
    expect(reveal.priced).toBe(false);
    expect(reveal.isGiveUp).toBe(true);
  });

  it("category and first-letter rungs are priced", () => {
    const ladder = buildHintLadder(word({ word: "happy" }), "cloze_sentence");
    expect(ladder.find((r) => r.kind === "category")!.priced).toBe(true);
    expect(ladder.find((r) => r.kind === "firstLetter")!.priced).toBe(true);
  });

  it("audio is FREE when it IS the prompt (dictation_word, dictation_sentence) — spec §2.3 corrected rule", () => {
    const dictationWordLadder = buildHintLadder(word(), "dictation_word");
    const dictationSentenceLadder = buildHintLadder(word(), "dictation_sentence");
    expect(dictationWordLadder.find((r) => r.kind === "audio")!.priced).toBe(false);
    expect(dictationSentenceLadder.find((r) => r.kind === "audio")!.priced).toBe(false);
  });

  it("audio is PRICED when it does not form part of the enunciado (cloze_sentence's optional word-audio)", () => {
    const clozeLadder = buildHintLadder(word(), "cloze_sentence");
    expect(clozeLadder.find((r) => r.kind === "audio")!.priced).toBe(true);
  });

  it("audio is PRICED for recall_translation (the enunciado is the Spanish prompt, not audio)", () => {
    const ladder = buildHintLadder(word(), "recall_translation");
    expect(ladder.find((r) => r.kind === "audio")!.priced).toBe(true);
  });

  it("multiple-choice modes (recognize_*) have NO hints at all — empty ladder", () => {
    for (const mode of ["recognize_translation", "recognize_meaning", "recognize_audio", "recognize_cloze"] as const) {
      expect(buildHintLadder(word(), mode)).toEqual([]);
    }
  });
});
