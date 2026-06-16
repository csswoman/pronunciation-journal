import { describe, expect, it, vi, afterEach } from "vitest";
import { getWordOfDay, isWordOfDay } from "@/lib/word-of-day";

describe("isWordOfDay", () => {
  it("accepts valid payloads", () => {
    expect(
      isWordOfDay({
        word: "resilient",
        ipa: "/rɪˈzɪliənt/",
        definition: "Able to recover quickly.",
        example_sentence: "She is resilient.",
        difficulty: "intermediate",
      }),
    ).toBe(true);
  });

  it("rejects invalid payloads", () => {
    expect(isWordOfDay({ error: "AI service unavailable" })).toBe(false);
    expect(isWordOfDay(null)).toBe(false);
  });
});

describe("getWordOfDay", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a fallback word when the dictionary API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    const result = await getWordOfDay({ forceRefresh: true });

    expect(result.word.length).toBeGreaterThan(0);
    expect(result.definition.length).toBeGreaterThan(0);
    expect(result.difficulty).toMatch(/beginner|intermediate|advanced/);
  });
});
