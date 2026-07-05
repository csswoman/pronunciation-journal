import { describe, expect, it, vi } from "vitest";
import { loadEssentialWordsQueue } from "../session-loader";

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
});
