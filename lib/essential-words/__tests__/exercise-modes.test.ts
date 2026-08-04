import { describe, expect, it } from "vitest";
import {
  selectMode,
  modeHasData,
  MODE_REQUIRED_FIELD,
  type EssentialWordMode,
} from "../exercise-modes";
import type { EssentialWordQueueItem } from "../queue";
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

function item(
  kind: EssentialWordQueueItem["kind"],
  e: EssentialWord = entry(),
  repetitions = 0,
): EssentialWordQueueItem {
  return { kind, entry: e, repetitions };
}

describe("selectMode — tiers", () => {
  it("sends new words to study", () => {
    expect(selectMode(item("new"))).toBe("study");
  });

  it("gives learning items recognition, never production", () => {
    for (let reps = 0; reps <= 10; reps++) {
      const mode = selectMode(item("learning", entry(), reps));
      expect([
        "recognize_translation",
        "recognize_meaning",
        "recognize_audio",
      ]).toContain(mode);
    }
  });

  it("uses recognition for tender reviews (repetitions <= 2)", () => {
    for (let reps = 0; reps <= 2; reps++) {
      const mode = selectMode(item("review", entry(), reps));
      expect([
        "recognize_translation",
        "recognize_meaning",
        "recognize_audio",
      ]).toContain(mode);
    }
  });

  it("uses dictation, weak form, or cloze for middle reviews (3-5)", () => {
    for (let reps = 3; reps <= 5; reps++) {
      const mode = selectMode(item("review", entry(), reps));
      expect(["dictation_sentence", "weak_form", "cloze_sentence"]).toContain(mode);
    }
  });

  it("uses production or cloze for mature reviews (>= 6)", () => {
    for (let reps = 6; reps <= 12; reps++) {
      const mode = selectMode(item("review", entry(), reps));
      expect([
        "speak_sentence",
        "cloze_sentence",
        "recall_translation",
      ]).toContain(mode);
    }
  });
});

describe("selectMode — rotación", () => {
  it("is deterministic: same item always gets the same mode", () => {
    const it1 = item("review", entry(), 1);
    expect(selectMode(it1)).toBe(selectMode(it1));
  });

  it("varies the tender mode as repetitions advance (meaning is no longer dead code)", () => {
    const seen = new Set<EssentialWordMode>();
    // La rotación avanza con repetitions; el tier tender se corta en 2, así que
    // se recorre el ciclo completo con kind 'learning', que usa el mismo set.
    for (let reps = 0; reps <= 5; reps++) {
      seen.add(selectMode(item("learning", entry(), reps)));
    }
    expect(seen).toEqual(
      new Set([
        "recognize_translation",
        "recognize_meaning",
        "recognize_audio",
      ]),
    );
  });

  it("varies the middle mode across repetitions", () => {
    const seen = new Set<EssentialWordMode>();
    for (let reps = 3; reps <= 5; reps++) {
      seen.add(selectMode(item("review", entry(), reps)));
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe("selectMode — anti-repetición (previousMode)", () => {
  it("avoids repeating the previous card's mode when an alternative has data", () => {
    const target = item("review", entry(), 1);
    const chosen = selectMode(target);
    const avoided = selectMode(target, chosen);
    expect(avoided).not.toBe(chosen);
    expect([
      "recognize_translation",
      "recognize_meaning",
      "recognize_audio",
    ]).toContain(avoided);
  });

  it("repeats the mode when it is the only usable candidate", () => {
    // Tier medio sin ipa_weak (no weak_form) y con una oración sin contexto
    // suficiente (no cloze) deja dictation_sentence como único viable.
    const only = item("review", entry({ example_sentence: "It is through." }), 3);
    expect(selectMode(only)).toBe("dictation_sentence");
    expect(selectMode(only, "dictation_sentence")).toBe("dictation_sentence");
  });
});

describe("selectMode — modos nuevos (fase 1.5)", () => {
  it("puts recognize_audio in the tender tier", () => {
    const seen = new Set<EssentialWordMode>();
    for (let reps = 0; reps <= 5; reps++) {
      seen.add(selectMode(item("learning", entry(), reps)));
    }
    expect(seen.has("recognize_audio")).toBe(true);
  });

  it("puts recall_translation in the mature tier", () => {
    const seen = new Set<EssentialWordMode>();
    for (let reps = 6; reps <= 14; reps++) {
      seen.add(selectMode(item("review", entry(), reps)));
    }
    expect(seen.has("recall_translation")).toBe(true);
  });

  it("recognize_audio needs no optional field — only the word itself", () => {
    const bare = entry({ meaning: undefined, translation: undefined });
    expect(modeHasData(bare, "recognize_audio")).toBe(true);
  });

  it("skips recall_translation when translation is missing", () => {
    const noTranslation = entry({ translation: undefined });
    expect(modeHasData(noTranslation, "recall_translation")).toBe(false);
    for (let reps = 6; reps <= 14; reps++) {
      expect(selectMode(item("review", noTranslation, reps))).not.toBe(
        "recall_translation",
      );
    }
  });
});

describe("selectMode — fallbacks", () => {
  it("uses audio recognition when no text-based tender candidate has data", () => {
    // recognize_audio solo necesita `word`, así que sigue siendo viable aunque
    // falten meaning y translation — no hace falta caer a speak_sentence.
    const bare = entry({ meaning: undefined, translation: undefined });
    expect(selectMode(item("review", bare, 1))).toBe("recognize_audio");
  });

  // Invariante central: nunca elegir un modo sin datos.
  it("never returns a mode whose backing data is absent", () => {
    const variants: EssentialWord[] = [
      entry(),
      entry({ translation: undefined }),
      entry({ meaning: undefined }),
      entry({ meaning: undefined, translation: undefined }),
      entry({ ipa_weak: "/ðə/", sentence_ipa: "/wiː wɔːkt ðə pɑːrk/" }),
      entry({ example_sentence: "It is through." }), // cloze inviable: sin contexto
    ];
    const kinds: EssentialWordQueueItem["kind"][] = ["review", "learning"];
    const previous: (EssentialWordMode | undefined)[] = [
      undefined,
      "recognize_translation",
      "dictation_sentence",
      "speak_sentence",
      "recognize_audio",
      "recall_translation",
    ];

    for (const e of variants) {
      for (const kind of kinds) {
        for (let reps = 0; reps <= 10; reps++) {
          for (const prev of previous) {
            const mode = selectMode(item(kind, e, reps), prev);
            expect(modeHasData(e, mode)).toBe(true);
          }
        }
      }
    }
  });

  it("keeps MODE_REQUIRED_FIELD in sync with the mode list", () => {
    expect(Object.keys(MODE_REQUIRED_FIELD).sort()).toEqual(
      [
        "cloze_sentence",
        "dictation_sentence",
        "recall_translation",
        "recognize_audio",
        "recognize_meaning",
        "recognize_translation",
        "speak_sentence",
        "study",
        "weak_form",
      ].sort(),
    );
  });
});
