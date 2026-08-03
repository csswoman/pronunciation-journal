import { describe, expect, it } from "vitest";
import { selectMode, MODE_REQUIRED_FIELD } from "../exercise-modes";
import type { EssentialWordQueueItem } from "../queue";
import type { EssentialWord } from "../types";

function entry(overrides: Partial<EssentialWord> = {}): EssentialWord {
  return {
    rank: 1,
    word: "through",
    pos: "preposition",
    ipa_strong: "θruː",
    example_sentence: "We walked through the park.",
    cefr_level: "A1",
    meaning: "from one side to the other",
    translation: "a través de",
    ...overrides,
  };
}

function item(
  kind: EssentialWordQueueItem["kind"],
  e: EssentialWord = entry(),
  repetitions = 0,
): EssentialWordQueueItem {
  return { kind, entry: e, repetitions };
}

describe("selectMode", () => {
  it("sends new words to study", () => {
    expect(selectMode(item("new"))).toBe("study");
  });

  it("gives learning items recognition, never full production", () => {
    expect(selectMode(item("learning"))).not.toBe("speak_sentence");
  });

  it("uses recognition for tender reviews (repetitions <= 2)", () => {
    const mode = selectMode(item("review", entry(), 2));
    expect(["recognize_translation", "recognize_meaning"]).toContain(mode);
  });

  it("uses dictation or weak form for middle reviews (3-5)", () => {
    const mode = selectMode(item("review", entry(), 4));
    expect(["dictation_sentence", "weak_form"]).toContain(mode);
  });

  it("uses speech for mature reviews (>= 6)", () => {
    expect(selectMode(item("review", entry(), 6))).toBe("speak_sentence");
  });

  it("falls back to speech when the required field is missing", () => {
    const noText = entry({ meaning: undefined, translation: undefined });
    expect(selectMode(item("review", noText, 1))).toBe("speak_sentence");
  });

  // The core invariant from the spec.
  it("never returns a mode whose backing data is absent", () => {
    const variants: EssentialWord[] = [
      entry(),
      entry({ translation: undefined }),
      entry({ meaning: undefined }),
      entry({ meaning: undefined, translation: undefined }),
      entry({ ipa_weak: "ðə", sentence_ipa: "wiː wɔːkt ðə pɑːrk" }),
    ];
    const kinds: EssentialWordQueueItem["kind"][] = ["review", "learning"];

    for (const e of variants) {
      for (const kind of kinds) {
        for (let reps = 0; reps <= 10; reps++) {
          const mode = selectMode(item(kind, e, reps));
          const field = MODE_REQUIRED_FIELD[mode];
          if (field) expect(e[field]).toBeTruthy();
        }
      }
    }
  });
});
