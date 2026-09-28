// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useKnownWordsTriage } from "../useKnownWordsTriage";
import * as client from "@/lib/essential-words/client";
import * as db from "@/lib/db";
import * as learnerStateQueries from "@/lib/essential-words/learner-state-queries";
import type { EssentialWord } from "@/lib/essential-words/types";

const mockWords: EssentialWord[] = [
  { word: "apple", rank: 1, pos: "noun", ipa_strong: "/ˈæp.əl/", example_sentence: "An apple.", cefr_level: "A1" },
  { word: "banana", rank: 2, pos: "noun", ipa_strong: "/bəˈnæn.ə/", example_sentence: "A banana.", cefr_level: "A1" },
  { word: "cherry", rank: 3, pos: "noun", ipa_strong: "/ˈtʃer.i/", example_sentence: "A cherry.", cefr_level: "A2" },
];

const mockCatalogIndex = mockWords.map((w) => ({
  word: w.word,
  rank: w.rank,
  pos: w.pos,
  cefr_level: w.cefr_level,
  chunk: 1,
  ipa_strong: w.ipa_strong,
}));

describe("useKnownWordsTriage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, "fetchCatalogIndex").mockResolvedValue(mockCatalogIndex);
    vi.spyOn(client, "fetchChunk").mockResolvedValue(mockWords);
    vi.spyOn(db, "getEssentialWordsSrsEntries").mockResolvedValue([]);
    vi.spyOn(learnerStateQueries, "getEssentialWordLearnerSignals").mockResolvedValue([]);
    vi.spyOn(learnerStateQueries, "getEssentialWordLearnerSignal").mockResolvedValue(undefined);
    vi.spyOn(learnerStateQueries, "declareEssentialWordKnown").mockImplementation(async (userId, wordId, now) => ({
      id: `${userId}:${wordId}`,
      userId,
      wordId,
      familiarity: "self-declared",
      declaredKnownAt: now ?? new Date().toISOString(),
      pronunciationDifficulty: "none",
      updatedAt: new Date().toISOString(),
    }));
    vi.spyOn(learnerStateQueries, "restoreEssentialWordKnownClaim").mockResolvedValue(undefined);
  });

  it("loads words, builds deck filtered by levels, and exposes initial state", async () => {
    const { result } = renderHook(() =>
      useKnownWordsTriage({ levels: ["A1"], userId: "user-123" })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isCardLoading).toBe(false);
    });

    expect(result.current.deck).toHaveLength(2);
    expect(result.current.current?.word).toBe("apple");
    expect(result.current.remaining).toBe(2);
    expect(result.current.counts).toEqual({ known: 0, skipped: 0 });
    expect(result.current.canUndo).toBe(false);
  });

  it("markKnown saves familiarity claim and advances deck", async () => {
    const { result } = renderHook(() =>
      useKnownWordsTriage({ levels: ["A1"], userId: "user-123" })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.markKnown();
    });

    expect(learnerStateQueries.declareEssentialWordKnown).toHaveBeenCalledWith(
      "user-123",
      "c1k:apple",
      expect.any(String),
    );
    expect(result.current.current?.word).toBe("banana");
    expect(result.current.remaining).toBe(1);
    expect(result.current.counts).toEqual({ known: 1, skipped: 0 });
    expect(result.current.canUndo).toBe(true);
  });

  it("skip advances without saving learner signal", async () => {
    const { result } = renderHook(() =>
      useKnownWordsTriage({ levels: ["A1"], userId: "user-123" })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.skip();
    });

    expect(learnerStateQueries.declareEssentialWordKnown).not.toHaveBeenCalled();
    expect(result.current.current?.word).toBe("banana");
    expect(result.current.remaining).toBe(1);
    expect(result.current.counts).toEqual({ known: 0, skipped: 1 });
    expect(result.current.canUndo).toBe(true);
  });

  it("undoLast reverts last markKnown by restoring claim state and decrementing counts", async () => {
    const { result } = renderHook(() =>
      useKnownWordsTriage({ levels: ["A1"], userId: "user-123" })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.markKnown();
    });
    expect(result.current.current?.word).toBe("banana");
    expect(result.current.counts.known).toBe(1);

    await act(async () => {
      await result.current.undoLast();
    });

    expect(learnerStateQueries.restoreEssentialWordKnownClaim).toHaveBeenCalledWith(
      "user-123",
      "c1k:apple",
      undefined,
      expect.any(String),
    );
    expect(result.current.current?.word).toBe("apple");
    expect(result.current.counts.known).toBe(0);
    expect(result.current.remaining).toBe(2);
    expect(result.current.canUndo).toBe(false);
  });
});
