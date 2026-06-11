import { describe, expect, it } from "vitest";
import { CoreWordSchema, CoreChunkSchema } from "../schema";
import { hasReduction, core1000WordId } from "../types";

const base = {
  rank: 4,
  word: "to",
  pos: "preposition",
  ipa_strong: "/tuː/",
  example_sentence: "I want to go home.",
  cefr_level: "A1",
};

describe("CoreWordSchema", () => {
  it("accepts a strong-only entry", () => {
    expect(CoreWordSchema.safeParse(base).success).toBe(true);
  });

  it("accepts a weak-form entry with sentence_ipa", () => {
    const entry = { ...base, ipa_weak: "/tə/", sentence_ipa: "/aɪ ˈwɑnt tə ˈɡoʊ ˈhoʊm/" };
    expect(CoreWordSchema.safeParse(entry).success).toBe(true);
  });

  it("rejects ipa_weak without sentence_ipa", () => {
    const entry = { ...base, ipa_weak: "/tə/" };
    expect(CoreWordSchema.safeParse(entry).success).toBe(false);
  });

  it("rejects rank out of range", () => {
    expect(CoreWordSchema.safeParse({ ...base, rank: 0 }).success).toBe(false);
    expect(CoreWordSchema.safeParse({ ...base, rank: 1001 }).success).toBe(false);
  });

  it("rejects unknown pos and cefr", () => {
    expect(CoreWordSchema.safeParse({ ...base, pos: "thing" }).success).toBe(false);
    expect(CoreWordSchema.safeParse({ ...base, cefr_level: "C2" }).success).toBe(false);
  });
});

describe("CoreChunkSchema", () => {
  it("requires version 1 and at least one entry", () => {
    expect(CoreChunkSchema.safeParse({ version: 1, entries: [base] }).success).toBe(true);
    expect(CoreChunkSchema.safeParse({ version: 2, entries: [base] }).success).toBe(false);
    expect(CoreChunkSchema.safeParse({ version: 1, entries: [] }).success).toBe(false);
  });
});

describe("helpers", () => {
  it("hasReduction derives from ipa_weak", () => {
    expect(hasReduction({ ...base, cefr_level: "A1", pos: "preposition" } as never)).toBe(false);
    expect(
      hasReduction({ ...base, ipa_weak: "/tə/", sentence_ipa: "/x/", cefr_level: "A1" } as never)
    ).toBe(true);
  });

  it("core1000WordId namespaces and lowercases", () => {
    expect(core1000WordId("To")).toBe("c1k:to");
  });
});
