import { describe, expect, it } from "vitest";
import {
  filterVaultEntries,
  isVaultEntry,
  sourceLabelFromWordId,
} from "../vault";
import type { SRSData } from "@/lib/types";

const base: SRSData = {
  wordId: "c1k:the",
  word: "the",
  ease: 2.5,
  interval: 1,
  repetitions: 1,
  nextReview: "2026-01-01T00:00:00.000Z",
};

function snoozed(
  word: string,
  nextReview: string,
  wordId = `c1k:${word}`,
): SRSData {
  return {
    ...base,
    wordId,
    word,
    status: "snoozed",
    nextReview,
    snoozedAt: "2026-07-01T00:00:00.000Z",
  };
}

function mastered(
  word: string,
  masteredAt: string,
  wordId = `srs:${word}`,
): SRSData {
  return {
    ...base,
    wordId,
    word,
    status: "mastered",
    masteredAt,
    nextReview: "2099-01-01T00:00:00.000Z",
  };
}

describe("sourceLabelFromWordId", () => {
  it("labels essential-words word ids", () => {
    expect(sourceLabelFromWordId("c1k:hello")).toBe("Palabras esenciales");
  });

  it("labels other word ids as SRS", () => {
    expect(sourceLabelFromWordId("srs:hello")).toBe("SRS");
    expect(sourceLabelFromWordId("hello")).toBe("SRS");
  });
});

describe("isVaultEntry", () => {
  it("includes snoozed and mastered via status", () => {
    expect(isVaultEntry({ ...base, status: "snoozed" })).toBe(true);
    expect(isVaultEntry({ ...base, status: "mastered" })).toBe(true);
  });

  it("includes legacy archived as snoozed", () => {
    expect(isVaultEntry({ ...base, archived: true })).toBe(true);
  });

  it("excludes active entries", () => {
    expect(isVaultEntry(base)).toBe(false);
    expect(isVaultEntry({ ...base, status: "active" })).toBe(false);
  });
});

describe("filterVaultEntries", () => {
  const entries: SRSData[] = [
    base,
    { ...base, status: "active", word: "active-word" },
    snoozed("apple", "2026-08-01T00:00:00.000Z"),
    snoozed("banana", "2026-06-01T00:00:00.000Z"),
    mastered("cat", "2026-07-10T00:00:00.000Z"),
    mastered("dog", "2026-07-20T00:00:00.000Z"),
    { ...base, archived: true, word: "legacy", nextReview: "2026-09-01T00:00:00.000Z" },
  ];

  it("returns only vault entries for filter=all", () => {
    const result = filterVaultEntries(entries, "all", "");
    expect(result.map((e) => e.word)).toEqual([
      "banana",
      "apple",
      "legacy",
      "dog",
      "cat",
    ]);
  });

  it("filters snoozed only", () => {
    const result = filterVaultEntries(entries, "snoozed", "");
    expect(result.map((e) => e.word)).toEqual(["banana", "apple", "legacy"]);
  });

  it("filters mastered only", () => {
    const result = filterVaultEntries(entries, "mastered", "");
    expect(result.map((e) => e.word)).toEqual(["dog", "cat"]);
  });

  it("searches by word (case-insensitive)", () => {
    const result = filterVaultEntries(entries, "all", "  APP ");
    expect(result.map((e) => e.word)).toEqual(["apple"]);
  });

  it("sorts snoozed by nextReview asc", () => {
    const snoozedEntries = [
      snoozed("z", "2026-12-01T00:00:00.000Z"),
      snoozed("a", "2026-01-01T00:00:00.000Z"),
    ];
    const result = filterVaultEntries(snoozedEntries, "snoozed", "");
    expect(result.map((e) => e.word)).toEqual(["a", "z"]);
  });

  it("sorts mastered by masteredAt desc", () => {
    const masteredEntries = [
      mastered("old", "2026-01-01T00:00:00.000Z"),
      mastered("new", "2026-12-01T00:00:00.000Z"),
    ];
    const result = filterVaultEntries(masteredEntries, "mastered", "");
    expect(result.map((e) => e.word)).toEqual(["new", "old"]);
  });

  it("places snoozed before mastered when mixed", () => {
    const mixed = [
      mastered("m", "2026-12-01T00:00:00.000Z"),
      snoozed("s", "2026-06-01T00:00:00.000Z"),
    ];
    const result = filterVaultEntries(mixed, "all", "");
    expect(result.map((e) => e.word)).toEqual(["s", "m"]);
  });
});
