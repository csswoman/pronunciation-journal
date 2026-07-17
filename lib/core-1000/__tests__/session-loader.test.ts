import { describe, expect, it, vi } from "vitest";
import { loadEssentialWordsQueue } from "../session-loader";
import { getCore1000SrsEntries } from "@/lib/db";
import type { SRSData } from "@/lib/types";

vi.mock("../client", () => ({
  fetchCoreWords: vi.fn(async () => [
    {
      rank: 1,
      word: "test",
      pos: "noun",
      ipa_strong: "test",
      example_sentence: "This is a test.",
      cefr_level: "A1",
    },
  ]),
}))

vi.mock("@/lib/db", () => ({
  db: {
    srsData: {
      put: vi.fn(async () => undefined),
    },
  },
  getCore1000SrsEntries: vi.fn(async () => []),
  getCore1000IntroducedToday: vi.fn(async () => []),
}))

describe("loadEssentialWordsQueue", () => {
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
      interval: 1,
      easeFactor: 2.5,
      repetitions: 1,
      nextReview: "2026-07-01T00:00:00.000Z",
      status: "snoozed",
      snoozedAt: "2026-01-01T00:00:00.000Z",
    };
    vi.mocked(getCore1000SrsEntries).mockResolvedValue([expiredSnooze]);

    const result = await loadEssentialWordsQueue();

    expect(result.items).toHaveLength(1);
    expect(result.items[0].kind).toBe("review");
    expect(result.items[0].fromSnooze).toBe(true);
    expect(result.initialPhase).toBe("speak");
  });
});
