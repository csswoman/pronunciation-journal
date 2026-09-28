import { describe, expect, it } from "vitest";
import { buildTriageDeck } from "../triage-deck";
import type { EssentialWord } from "../types";
import type { SRSData } from "@/lib/types";

function createDummyWord(word: string, rank: number, level: "A1" | "A2" | "B1"): EssentialWord {
  return {
    word,
    rank,
    pos: "noun",
    ipa_strong: `/${word}/`,
    example_sentence: `This is ${word}.`,
    cefr_level: level,
  };
}

describe("buildTriageDeck", () => {
  const words: EssentialWord[] = [
    createDummyWord("apple", 10, "A1"),
    createDummyWord("banana", 20, "A1"),
    createDummyWord("cherry", 30, "A2"),
    createDummyWord("date", 40, "B1"),
    createDummyWord("elderberry", 50, "A1"),
  ];

  it("filters words matching the specified CEFR levels", () => {
    const deck = buildTriageDeck(words, [], ["A1"]);
    expect(deck.map((w) => w.word)).toEqual(["apple", "banana", "elderberry"]);
  });

  it("filters words matching multiple CEFR levels", () => {
    const deck = buildTriageDeck(words, [], ["A1", "A2"]);
    expect(deck.map((w) => w.word)).toEqual(["apple", "banana", "cherry", "elderberry"]);
  });

  it("excludes words that already have any SRS entry (mastered, snoozed, active, etc.)", () => {
    const srsEntries: SRSData[] = [
      {
        wordId: "c1k:apple",
        word: "apple",
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: "2026-10-01T00:00:00.000Z",
        status: "mastered",
      },
      {
        wordId: "c1k:cherry",
        word: "cherry",
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: "2026-10-01T00:00:00.000Z",
      },
    ];

    const deck = buildTriageDeck(words, srsEntries, ["A1", "A2"]);
    // apple excluded (seen), cherry excluded (seen)
    expect(deck.map((w) => w.word)).toEqual(["banana", "elderberry"]);
  });

  it("orders cards by rank ascending", () => {
    const unorderedWords: EssentialWord[] = [
      createDummyWord("second", 20, "A1"),
      createDummyWord("first", 5, "A1"),
      createDummyWord("third", 50, "A1"),
    ];

    const deck = buildTriageDeck(unorderedWords, [], ["A1"]);
    expect(deck.map((w) => w.word)).toEqual(["first", "second", "third"]);
  });
});
