import { describe, expect, it } from "vitest";
import { buildSessionQueue } from "../queue";
import { core1000WordId, type CoreWord } from "../types";
import type { SRSData } from "@/lib/types";

const NOW = new Date("2026-06-11T12:00:00Z");

function word(rank: number, w: string): CoreWord {
  return {
    rank, word: w, pos: "noun", ipa_strong: `/${w}/`,
    example_sentence: `A ${w} here.`, cefr_level: "A1",
  };
}

function srs(w: string, nextReviewIso: string): SRSData {
  return {
    wordId: core1000WordId(w), word: w, ease: 2.5,
    interval: 1, repetitions: 1, nextReview: nextReviewIso,
  };
}

const WORDS = [word(1, "the"), word(2, "be"), word(3, "and"), word(4, "of"), word(5, "to")];

describe("buildSessionQueue", () => {
  it("puts due reviews first, then new cards by rank", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [srs("of", "2026-06-10T00:00:00Z")],
      introducedToday: [],
      now: NOW,
      newPerDay: 2,
    });
    expect(q.map((i) => [i.entry.word, i.isNew])).toEqual([
      ["of", false], ["the", true], ["be", true],
    ]);
  });

  it("excludes reviews not yet due", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [srs("of", "2026-06-20T00:00:00Z")],
      introducedToday: [],
      now: NOW,
      newPerDay: 0,
    });
    expect(q).toEqual([]);
  });

  it("discounts cards already introduced today from the quota", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [srs("the", "2026-06-12T00:00:00Z"), srs("be", "2026-06-12T00:00:00Z")],
      introducedToday: ["the", "be"],
      now: NOW,
      newPerDay: 3,
    });
    expect(q.map((i) => i.entry.word)).toEqual(["and"]); // 3 - 2 = 1 nueva
  });

  it("never returns a negative quota", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [],
      introducedToday: ["the", "be", "and", "of"],
      now: NOW,
      newPerDay: 2,
    });
    expect(q).toEqual([]);
  });

  it("ignores srs entries whose word is not in the dataset", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [srs("ghost", "2026-06-01T00:00:00Z")],
      introducedToday: [],
      now: NOW,
      newPerDay: 0,
    });
    expect(q).toEqual([]);
  });
});
