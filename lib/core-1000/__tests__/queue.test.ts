import { describe, expect, it } from "vitest";
import { buildSessionQueue, appendNewBatch } from "../queue";
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
    expect(q.map((i) => [i.entry.word, i.kind])).toEqual([
      ["of", "review"], ["the", "new"], ["be", "new"],
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

describe("kind field", () => {
  it("due reviews have kind 'review'", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [srs("of", "2026-06-10T00:00:00Z")],
      introducedToday: [],
      now: NOW,
      newPerDay: 0,
    });
    expect(q[0].kind).toBe("review");
  });

  it("new cards have kind 'new'", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [],
      introducedToday: [],
      now: NOW,
      newPerDay: 2,
    });
    expect(q.every((i) => i.kind === "new")).toBe(true);
  });

  it("treats all srsEntries as seen (archived filtering is caller's responsibility)", () => {
    // getCore1000SrsEntries already strips archived before calling buildSessionQueue.
    // The queue trusts the caller: any entry in srsEntries counts as seen (not new).
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [srs("the", "2026-06-20T00:00:00Z")], // not due, but seen
      introducedToday: [],
      now: NOW,
      newPerDay: 3,
    });
    const words = q.map((i) => i.entry.word);
    expect(words).not.toContain("the"); // seen → not new
    expect(q.length).toBe(3); // be, and, of
  });
});

describe("appendNewBatch", () => {
  it("appends next N new words by rank, skipping already queued or seen", () => {
    const existing = [
      { entry: WORDS[0], kind: "new" as const },
      { entry: WORDS[1], kind: "review" as const },
    ];
    const seen = new Set([core1000WordId("the"), core1000WordId("be")]);
    const result = appendNewBatch(existing, WORDS, seen, 2);
    expect(result.map((i) => i.entry.word)).toEqual(["the", "be", "and", "of"]);
    expect(result[2].kind).toBe("new");
    expect(result[3].kind).toBe("new");
  });

  it("does not exceed available unseen words", () => {
    const seen = new Set(WORDS.map((w) => core1000WordId(w.word)));
    const result = appendNewBatch([], WORDS, seen, 5);
    expect(result).toEqual([]);
  });
});
