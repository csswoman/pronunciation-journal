import { describe, expect, it } from "vitest";
import { EssentialWordSchema, EssentialWordChunkSchema } from "../schema";
import { hasReduction, essentialWordId } from "../types";

const base = {
  rank: 4,
  word: "to",
  pos: "preposition",
  ipa_strong: "/tuː/",
  example_sentence: "I want to go home.",
  cefr_level: "A1",
};

describe("EssentialWordSchema", () => {
  it("accepts a strong-only entry", () => {
    expect(EssentialWordSchema.safeParse(base).success).toBe(true);
  });

  it("accepts a weak-form entry with sentence_ipa", () => {
    const entry = { ...base, ipa_weak: "/tə/", sentence_ipa: "/aɪ ˈwɑnt tə ˈɡoʊ ˈhoʊm/" };
    expect(EssentialWordSchema.safeParse(entry).success).toBe(true);
  });

  it("rejects ipa_weak without sentence_ipa", () => {
    const entry = { ...base, ipa_weak: "/tə/" };
    expect(EssentialWordSchema.safeParse(entry).success).toBe(false);
  });

  it("rejects rank out of range", () => {
    expect(EssentialWordSchema.safeParse({ ...base, rank: 0 }).success).toBe(false);
    expect(EssentialWordSchema.safeParse({ ...base, rank: 2801 }).success).toBe(false);
  });

  it("rejects unknown pos and cefr", () => {
    expect(EssentialWordSchema.safeParse({ ...base, pos: "thing" }).success).toBe(false);
    expect(EssentialWordSchema.safeParse({ ...base, cefr_level: "C2" }).success).toBe(false);
  });
});

describe("EssentialWordChunkSchema", () => {
  it("requires version 1 and at least one entry", () => {
    expect(EssentialWordChunkSchema.safeParse({ version: 1, entries: [base] }).success).toBe(true);
    expect(EssentialWordChunkSchema.safeParse({ version: 2, entries: [base] }).success).toBe(false);
    expect(EssentialWordChunkSchema.safeParse({ version: 1, entries: [] }).success).toBe(false);
  });
});

describe("helpers", () => {
  it("hasReduction derives from ipa_weak", () => {
    expect(hasReduction({ ...base, cefr_level: "A1", pos: "preposition" } as never)).toBe(false);
    expect(
      hasReduction({ ...base, ipa_weak: "/tə/", sentence_ipa: "/x/", cefr_level: "A1" } as never)
    ).toBe(true);
  });

  it("essentialWordId namespaces and lowercases", () => {
    expect(essentialWordId("To")).toBe("c1k:to");
  });
});

describe("example_sentences", () => {
  it("accepts an entry with no variants (back-compat)", () => {
    expect(EssentialWordSchema.safeParse(base).success).toBe(true);
  });

  it("accepts well-formed variants", () => {
    const withVariants = {
      ...base,
      example_sentences: [
        { sentence: "I want to go home.", sentence_ipa: "/aɪ wɑnt tu ɡoʊ hoʊm/" },
        { sentence: "We want more time.", sentence_ipa: "/wi wɑnt mɔr taɪm/" },
      ],
    };
    expect(EssentialWordSchema.safeParse(withVariants).success).toBe(true);
  });

  it("rejects a variant whose sentence_ipa is not slash-wrapped", () => {
    const bad = {
      ...base,
      example_sentences: [{ sentence: "I want it.", sentence_ipa: "aɪ wɑnt ɪt" }],
    };
    expect(EssentialWordSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects an empty variants array — omit the field instead", () => {
    expect(
      EssentialWordSchema.safeParse({ ...base, example_sentences: [] }).success
    ).toBe(false);
  });
});
