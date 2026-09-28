// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useKnownWordsTriage } from "../useKnownWordsTriage";
import * as client from "@/lib/essential-words/client";
import * as db from "@/lib/db";
import * as recheck from "@/lib/essential-words/triage-recheck";
import type { EssentialWord } from "@/lib/essential-words/types";

const mockWords: EssentialWord[] = [
  { word: "apple", rank: 1, pos: "noun", ipa_strong: "/ˈæp.əl/", example_sentence: "An apple.", cefr_level: "A1" },
  { word: "banana", rank: 2, pos: "noun", ipa_strong: "/bəˈnæn.ə/", example_sentence: "A banana.", cefr_level: "A1" },
  { word: "cherry", rank: 3, pos: "noun", ipa_strong: "/ˈtʃer.i/", example_sentence: "A cherry.", cefr_level: "A2" },
];

describe("useKnownWordsTriage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, "fetchEssentialWords").mockResolvedValue(mockWords);
    vi.spyOn(db, "getEssentialWordsSrsEntries").mockResolvedValue([]);
    vi.spyOn(db, "masterEssentialWord").mockResolvedValue(undefined);
    vi.spyOn(db, "scheduleEssentialWordRecheck").mockResolvedValue(undefined);
    vi.spyOn(db, "deleteEssentialWordSrs").mockResolvedValue(undefined);
  });

  it("loads words, builds deck filtered by levels, and exposes initial state", async () => {
    const { result } = renderHook(() =>
      useKnownWordsTriage({ levels: ["A1"], userId: "user-123" })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.deck).toHaveLength(2);
    expect(result.current.current?.word).toBe("apple");
    expect(result.current.remaining).toBe(2);
    expect(result.current.counts).toEqual({ known: 0, skipped: 0 });
    expect(result.current.canUndo).toBe(false);
  });

  it("markKnown calls masterEssentialWord when not sampled for recheck", async () => {
    vi.spyOn(recheck, "shouldSampleForRecheck").mockReturnValue(false);

    const { result } = renderHook(() =>
      useKnownWordsTriage({ levels: ["A1"], userId: "user-123" })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.markKnown();
    });

    expect(db.masterEssentialWord).toHaveBeenCalledWith("apple", "user-123");
    expect(db.scheduleEssentialWordRecheck).not.toHaveBeenCalled();
    expect(result.current.current?.word).toBe("banana");
    expect(result.current.remaining).toBe(1);
    expect(result.current.counts).toEqual({ known: 1, skipped: 0 });
    expect(result.current.canUndo).toBe(true);
  });

  it("markKnown calls scheduleEssentialWordRecheck when sampled for recheck", async () => {
    vi.spyOn(recheck, "shouldSampleForRecheck").mockReturnValue(true);

    const { result } = renderHook(() =>
      useKnownWordsTriage({ levels: ["A1"], userId: "user-123" })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.markKnown();
    });

    expect(db.scheduleEssentialWordRecheck).toHaveBeenCalledWith("apple", 4, "user-123");
    expect(db.masterEssentialWord).not.toHaveBeenCalled();
    expect(result.current.current?.word).toBe("banana");
    expect(result.current.counts).toEqual({ known: 1, skipped: 0 });
  });

  it("skip advances without saving to DB", async () => {
    const { result } = renderHook(() =>
      useKnownWordsTriage({ levels: ["A1"], userId: "user-123" })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.skip();
    });

    expect(db.masterEssentialWord).not.toHaveBeenCalled();
    expect(db.scheduleEssentialWordRecheck).not.toHaveBeenCalled();
    expect(result.current.current?.word).toBe("banana");
    expect(result.current.remaining).toBe(1);
    expect(result.current.counts).toEqual({ known: 0, skipped: 1 });
    expect(result.current.canUndo).toBe(true);
  });

  it("undoLast reverts last markKnown by deleting SRS row and decrementing counts", async () => {
    vi.spyOn(recheck, "shouldSampleForRecheck").mockReturnValue(false);

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

    expect(db.deleteEssentialWordSrs).toHaveBeenCalledWith("apple", "user-123");
    expect(result.current.current?.word).toBe("apple");
    expect(result.current.counts.known).toBe(0);
    expect(result.current.remaining).toBe(2);
    expect(result.current.canUndo).toBe(false);
  });
});
