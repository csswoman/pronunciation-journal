import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadEssentialWordsQueue } from "../session-loader";
import { fetchEssentialWords } from "../client";
import { getEssentialWordsIntroducedToday, getEssentialWordsSrsEntries } from "@/lib/db";
import { getEssentialWordsDueTomorrowCount } from "../due-tomorrow";
import type { SRSData } from "@/lib/types";

import type { EssentialWord } from "../types";

vi.mock("../client", () => {
  const mockWords: EssentialWord[] = [
    {
      rank: 1,
      word: "test",
      pos: "noun",
      ipa_strong: "test",
      example_sentence: "This is a test.",
      cefr_level: "A1",
    },
  ];
  const fetchEssentialWords = vi.fn(async () => mockWords);
  return {
    fetchEssentialWords,
    fetchCatalogIndex: vi.fn(async () => {
      const words = await fetchEssentialWords();
      return words.map((w) => ({
        rank: w.rank,
        word: w.word,
        pos: w.pos,
        cefr_level: w.cefr_level,
        chunk: Math.ceil(w.rank / 100),
        ipa_strong: w.ipa_strong,
        ipa_weak: w.ipa_weak,
      }));
    }),
    fetchChunks: vi.fn(async () => {
      const words = await fetchEssentialWords();
      return new Map(words.map((w) => [w.word, w]));
    }),
    fetchChunk: vi.fn(async () => await fetchEssentialWords()),
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    srsData: {
      put: vi.fn(async () => undefined),
    },
  },
  getEssentialWordsSrsEntries: vi.fn(async () => []),
  getEssentialWordsIntroducedToday: vi.fn(async () => []),
}));

vi.mock("../due-tomorrow", () => ({
  getEssentialWordsDueTomorrowCount: vi.fn(async () => 0),
}));

describe("loadEssentialWordsQueue", () => {
  beforeEach(() => {
    vi.mocked(fetchEssentialWords).mockResolvedValue([
      {
        rank: 1,
        word: "test",
        pos: "noun",
        ipa_strong: "test",
        example_sentence: "This is a test.",
        cefr_level: "A1",
      },
    ]);
    vi.mocked(getEssentialWordsSrsEntries).mockResolvedValue([]);
    vi.mocked(getEssentialWordsIntroducedToday).mockResolvedValue([]);
    vi.mocked(getEssentialWordsDueTomorrowCount).mockResolvedValue(0);
  });

  it("limits a first session to one complete three-word guided block", async () => {
    vi.mocked(fetchEssentialWords).mockResolvedValue(
      Array.from({ length: 10 }, (_, index) => ({
        rank: index + 1,
        word: `word-${index + 1}`,
        pos: "noun" as const,
        ipa_strong: `word-${index + 1}`,
        example_sentence: "This is a word.",
        cefr_level: "A1" as const,
      })),
    );

    const result = await loadEssentialWordsQueue();

    expect(result.items).toHaveLength(3);
    expect(result.items.every((item) => item.kind === "new")).toBe(true);
  });

  it("fills the Essential Words block even when the Daily Plan recorded introductions today", async () => {
    vi.mocked(fetchEssentialWords).mockResolvedValue(
      Array.from({ length: 5 }, (_, index) => ({
        rank: index + 1,
        word: `word-${index + 1}`,
        pos: "noun" as const,
        ipa_strong: `word-${index + 1}`,
        example_sentence: "This is a word.",
        cefr_level: "A1" as const,
      })),
    );
    vi.mocked(getEssentialWordsIntroducedToday).mockResolvedValue(["word-1", "word-2"]);
    vi.mocked(getEssentialWordsSrsEntries).mockResolvedValue([
      {
        wordId: "c1k:word-1", word: "word-1", ease: 2.5, interval: 1,
        repetitions: 1, nextReview: "2099-01-01T00:00:00.000Z",
      },
      {
        wordId: "c1k:word-2", word: "word-2", ease: 2.5, interval: 1,
        repetitions: 1, nextReview: "2099-01-01T00:00:00.000Z",
      },
    ]);

    const result = await loadEssentialWordsQueue();

    expect(result.items).toHaveLength(3);
    expect(result.items.map((item) => item.entry.word)).toEqual(["word-3", "word-4", "word-5"]);
  });

  it("keeps every due review and applies maxNewWords only to fresh words", async () => {
    const words = Array.from({ length: 9 }, (_, index) => ({
      rank: index + 1,
      word: `word-${index + 1}`,
      pos: "noun" as const,
      ipa_strong: `word-${index + 1}`,
      example_sentence: "This is a word.",
      cefr_level: "A1" as const,
    }));
    vi.mocked(fetchEssentialWords).mockResolvedValue(words);
    vi.mocked(getEssentialWordsSrsEntries).mockResolvedValue(
      words.slice(0, 4).map((entry) => ({
        wordId: `c1k:${entry.word}`, word: entry.word, ease: 2.5, interval: 1,
        repetitions: 1, nextReview: "2026-07-01T00:00:00.000Z",
      })),
    );

    const result = await loadEssentialWordsQueue(null, null, undefined, { maxNewWords: 1 });

    expect(result.items.filter((item) => item.kind === "review")).toHaveLength(4);
    expect(result.items.filter((item) => item.kind === "new")).toHaveLength(1);
  });

  it("loads words, builds queue stats, and derives initial phase", async () => {
    const result = await loadEssentialWordsQueue();

    expect(result.items).toHaveLength(1);
    expect(result.initialPhase).toBe("study");
    expect(result.stats).toMatchObject({
      totalWords: 1,
      learned: 0,
      dueCount: 0,
      newToday: 0,
    });
    expect(result.seenIds.size).toBe(0);
  });

  it("marks queue items activated from expired snooze", async () => {
    const expiredSnooze: SRSData = {
      wordId: "c1k:test",
      word: "test",
      ease: 2.5,
      interval: 1,
      repetitions: 1,
      nextReview: "2026-07-01T00:00:00.000Z",
      status: "snoozed",
      snoozedAt: "2026-01-01T00:00:00.000Z",
    };
    vi.mocked(getEssentialWordsSrsEntries).mockResolvedValue([expiredSnooze]);

    const result = await loadEssentialWordsQueue();

    expect(result.items).toHaveLength(1);
    expect(result.items[0].kind).toBe("review");
    expect(result.items[0].fromSnooze).toBe(true);
    expect(result.initialPhase).toBe("speak");
  });

  it("counts snoozed and mastered entries as vaulted", async () => {
    vi.mocked(getEssentialWordsSrsEntries).mockResolvedValue([
      {
        wordId: "c1k:snoozed-word",
        word: "snoozed-word",
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: "2099-01-01T00:00:00.000Z",
        status: "snoozed",
        snoozedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        wordId: "c1k:mastered-word",
        word: "mastered-word",
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: "2026-07-01T00:00:00.000Z",
        status: "mastered",
        masteredAt: "2026-01-01T00:00:00.000Z",
      },
      {
        wordId: "c1k:test",
        word: "test",
        ease: 2.5,
        interval: 1,
        repetitions: 1,
        nextReview: "2026-07-01T00:00:00.000Z",
      },
    ]);

    const result = await loadEssentialWordsQueue();

    expect(result.stats.vaulted).toBe(2);
  });

  it("surfaces the dueTomorrow count from getEssentialWordsDueTomorrowCount", async () => {
    vi.mocked(getEssentialWordsDueTomorrowCount).mockResolvedValue(3);

    const result = await loadEssentialWordsQueue(null, null, "user-1");

    expect(result.stats.dueTomorrow).toBe(3);
  });
});
