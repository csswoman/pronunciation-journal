import { describe, expect, it } from "vitest";
import { contrastsByCategory } from "../contrast-categories";
import { MINIMAL_PAIR_CONTRASTS } from "../minimal-pairs";

describe("contrastsByCategory", () => {
  it("splits every declared contrast into vowel or consonant, dropping none", () => {
    const grouped = contrastsByCategory(MINIMAL_PAIR_CONTRASTS);
    const total = grouped.vowel.length + grouped.consonant.length;
    expect(total).toBe(MINIMAL_PAIR_CONTRASTS.length);
  });

  it("groups vowel-to-vowel contrasts under vowel", () => {
    const grouped = contrastsByCategory(MINIMAL_PAIR_CONTRASTS);
    const vowelIds = grouped.vowel.map((c) => c.id);
    expect(vowelIds).toEqual(["iː-ɪ", "æ-ʌ", "æ-ɛ"]);
  });

  it("groups consonant-to-consonant contrasts under consonant", () => {
    const grouped = contrastsByCategory(MINIMAL_PAIR_CONTRASTS);
    const consonantIds = grouped.consonant.map((c) => c.id);
    expect(consonantIds).toEqual(["b-v", "θ-s", "ð-d", "ʃ-tʃ", "ŋ-n"]);
  });
});
