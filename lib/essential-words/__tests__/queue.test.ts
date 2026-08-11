import { describe, expect, it } from "vitest";
import { buildSessionQueue, appendNewBatch } from "../queue";
import { essentialWordId, type EssentialWord } from "../types";
import type { SRSData } from "@/lib/types";

const NOW = new Date("2026-06-11T12:00:00Z");

function word(
  rank: number,
  w: string,
  cefr: EssentialWord["cefr_level"] = "A1",
  pos: EssentialWord["pos"] = "noun",
): EssentialWord {
  return {
    rank, word: w, pos, ipa_strong: `/${w}/`,
    example_sentence: `A ${w} here.`, cefr_level: cefr,
  };
}

function srs(w: string, nextReviewIso: string): SRSData {
  return {
    wordId: essentialWordId(w), word: w, ease: 2.5,
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

  it("caps a session after prioritizing reviews and filling the remainder with new words", () => {
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [srs("the", "2026-06-10T00:00:00Z"), srs("be", "2026-06-10T00:00:00Z")],
      introducedToday: ["the", "be"],
      now: NOW,
      newPerDay: 5,
      maxItems: 3,
    });

    expect(q.map((item) => [item.entry.word, item.kind])).toEqual([
      ["the", "review"], ["be", "review"], ["and", "new"],
    ]);
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

  it("treats persisted entries as seen", () => {
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

  it("does not review or re-introduce snoozed words", () => {
    const snoozed = {
      ...srs("the", "2026-06-10T00:00:00Z"),
      status: "snoozed" as const,
    };
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [snoozed],
      introducedToday: [],
      now: NOW,
      newPerDay: 2,
    });

    expect(q.map((i) => [i.entry.word, i.kind])).toEqual([
      ["be", "new"],
      ["and", "new"],
    ]);
  });

  it("does not review or re-introduce mastered words", () => {
    const mastered = {
      ...srs("the", "2026-06-10T00:00:00Z"),
      status: "mastered" as const,
    };
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [mastered],
      introducedToday: [],
      now: NOW,
      newPerDay: 2,
    });

    expect(q.map((i) => [i.entry.word, i.kind])).toEqual([
      ["be", "new"],
      ["and", "new"],
    ]);
  });

  it("excludes legacy archived rows via effectiveStatus → snoozed", () => {
    const archived = { ...srs("the", "2026-06-10T00:00:00Z"), archived: true };
    const q = buildSessionQueue({
      words: WORDS,
      srsEntries: [archived],
      introducedToday: [],
      now: NOW,
      newPerDay: 2,
    });

    expect(q.map((i) => i.entry.word)).not.toContain("the");
    expect(q.every((i) => i.kind === "new")).toBe(true);
  });
});

describe("CEFR level filter", () => {
  const LEVELLED = [
    word(1, "cat", "A1"),
    word(2, "dog", "A2"),
    word(3, "run", "B1"),
    word(4, "leap", "B2"),
    word(5, "quell", "C1"),
  ];

  it("restricts new cards to the selected levels", () => {
    const q = buildSessionQueue({
      words: LEVELLED,
      srsEntries: [],
      introducedToday: [],
      now: NOW,
      newPerDay: 10,
      levels: ["B1", "B2"],
    });
    expect(q.map((i) => i.entry.word)).toEqual(["run", "leap"]);
  });

  it("restricts due reviews to the selected levels", () => {
    const q = buildSessionQueue({
      words: LEVELLED,
      srsEntries: [
        srs("dog", "2026-06-10T00:00:00Z"), // A2, due — excluded
        srs("run", "2026-06-10T00:00:00Z"), // B1, due — kept
      ],
      introducedToday: [],
      now: NOW,
      newPerDay: 0,
      levels: ["B1"],
    });
    expect(q.map((i) => [i.entry.word, i.kind])).toEqual([["run", "review"]]);
  });

  it("treats an empty level array as no filter", () => {
    const q = buildSessionQueue({
      words: LEVELLED,
      srsEntries: [],
      introducedToday: [],
      now: NOW,
      newPerDay: 10,
      levels: [],
    });
    expect(q).toHaveLength(5);
  });

  it("appendNewBatch honours the level filter", () => {
    const seen = new Set<string>();
    const result = appendNewBatch([], LEVELLED, seen, 10, ["C1"]);
    expect(result.map((i) => i.entry.word)).toEqual(["quell"]);
  });
});

describe("themed route filter (level + pos)", () => {
  const MIXED = [
    word(1, "cat", "B1", "noun"),
    word(2, "jump", "B1", "verb"),
    word(3, "sing", "B1", "verb"),
    word(4, "big", "B1", "adjective"),
    word(5, "leap", "B2", "verb"),
  ];

  it("restricts new cards to level + pos (e.g. B1 verbs)", () => {
    const q = buildSessionQueue({
      words: MIXED,
      srsEntries: [],
      introducedToday: [],
      now: NOW,
      newPerDay: 10,
      levels: ["B1"],
      pos: ["verb"],
    });
    expect(q.map((i) => i.entry.word)).toEqual(["jump", "sing"]);
  });

  it("pos filter alone spans all levels", () => {
    const q = buildSessionQueue({
      words: MIXED,
      srsEntries: [],
      introducedToday: [],
      now: NOW,
      newPerDay: 10,
      pos: ["verb"],
    });
    expect(q.map((i) => i.entry.word)).toEqual(["jump", "sing", "leap"]);
  });

  it("appendNewBatch honours the pos filter", () => {
    const result = appendNewBatch([], MIXED, new Set<string>(), 10, ["B1"], ["adjective"]);
    expect(result.map((i) => i.entry.word)).toEqual(["big"]);
  });
});

describe("buildSessionQueue repetitions", () => {
  it("carries SM-2 repetitions onto due review items", () => {
    const w = word(1, "through");
    const dueSrs: SRSData = {
      ...srs("through", "2020-01-01T00:00:00.000Z"),
      repetitions: 7,
    };
    const q = buildSessionQueue({
      words: [w],
      srsEntries: [dueSrs],
      introducedToday: [],
      now: NOW,
    });

    expect(q[0].kind).toBe("review");
    expect(q[0].repetitions).toBe(7);
  });

  it("leaves repetitions undefined for new words", () => {
    const w = word(1, "apple");
    const q = buildSessionQueue({
      words: [w],
      srsEntries: [],
      introducedToday: [],
      now: NOW,
    });

    expect(q[0].kind).toBe("new");
    expect(q[0].repetitions).toBeUndefined();
  });
});

describe("appendNewBatch", () => {
  it("appends next N new words by rank, skipping already queued or seen", () => {
    const existing = [
      { entry: WORDS[0], kind: "new" as const },
      { entry: WORDS[1], kind: "review" as const },
    ];
    const seen = new Set([essentialWordId("the"), essentialWordId("be")]);
    const result = appendNewBatch(existing, WORDS, seen, 2);
    expect(result.map((i) => i.entry.word)).toEqual(["the", "be", "and", "of"]);
    expect(result[2].kind).toBe("new");
    expect(result[3].kind).toBe("new");
  });

  it("does not exceed available unseen words", () => {
    const seen = new Set(WORDS.map((w) => essentialWordId(w.word)));
    const result = appendNewBatch([], WORDS, seen, 5);
    expect(result).toEqual([]);
  });
});
