import { describe, expect, it } from "vitest";
import { VOCAB_ROUTES, getRoute, wordsInRoute } from "../routes";
import type { EssentialWord } from "../types";

function word(rank: number, w: string, cefr: EssentialWord["cefr_level"], pos: EssentialWord["pos"]): EssentialWord {
  return { rank, word: w, pos, ipa_strong: `/${w}/`, example_sentence: `A ${w}.`, cefr_level: cefr };
}

const WORDS = [
  word(1, "cat", "B1", "noun"),
  word(2, "jump", "B1", "verb"),
  word(3, "leap", "B2", "verb"),
  word(4, "smart", "C1", "adjective"),
];

describe("VOCAB_ROUTES", () => {
  it("has unique ids", () => {
    const ids = VOCAB_ROUTES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getRoute", () => {
  it("resolves a known id and returns undefined otherwise", () => {
    expect(getRoute("verbs-b1")?.label).toBe("Verbos B1");
    expect(getRoute("nope")).toBeUndefined();
    expect(getRoute(null)).toBeUndefined();
  });
});

describe("wordsInRoute", () => {
  it("filters by level + pos", () => {
    const route = getRoute("verbs-b1")!;
    expect(wordsInRoute(WORDS, route).map((w) => w.word)).toEqual(["jump"]);
  });

  it("treats empty pos as level-only (all parts of speech)", () => {
    const route = getRoute("advanced-c1")!;
    expect(wordsInRoute(WORDS, route).map((w) => w.word)).toEqual(["smart"]);
  });
});
