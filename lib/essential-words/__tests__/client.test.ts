import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetEssentialWordsCache, fetchEssentialWords } from "../client";

const WORD = {
  rank: 1,
  word: "the",
  pos: "article",
  ipa_strong: "/ðiː/",
  example_sentence: "The book is here.",
  cefr_level: "A1",
} as const;

describe("fetchEssentialWords", () => {
  beforeEach(() => {
    __resetEssentialWordsCache();
    vi.restoreAllMocks();
  });

  it("prefers the combined dataset when available", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ version: 1, entries: [WORD] }),
    }) as typeof global.fetch;

    const words = await fetchEssentialWords();

    expect(words).toEqual([WORD]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/essential-words/words-all.json");
  });

  it("falls back to chunk loading when the combined dataset is absent", async () => {
    global.fetch = vi.fn().mockImplementation(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/words-all.json")) {
        return { ok: false, status: 404, json: async () => ({}) };
      }
      if (url.endsWith("/words-001.json")) {
        return { ok: true, status: 200, json: async () => ({ version: 1, entries: [WORD] }) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    }) as typeof global.fetch;

    const words = await fetchEssentialWords();

    expect(words).toEqual([WORD]);
    expect(global.fetch).toHaveBeenNthCalledWith(1, "/essential-words/words-all.json");
    expect(global.fetch).toHaveBeenNthCalledWith(2, "/essential-words/words-001.json");
  });

  it("shares the in-flight request across concurrent callers", async () => {
    let resolveFetch: ((value: { ok: boolean; status: number; json: () => Promise<unknown> }) => void) | undefined;
    global.fetch = vi.fn().mockImplementation(() =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    ) as typeof global.fetch;

    const first = fetchEssentialWords();
    const second = fetchEssentialWords();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    if (!resolveFetch) {
      throw new Error("fetch was not started");
    }
    resolveFetch({ ok: true, status: 200, json: async () => ({ version: 1, entries: [WORD] }) });

    await expect(first).resolves.toEqual([WORD]);
    await expect(second).resolves.toEqual([WORD]);
  });
});
