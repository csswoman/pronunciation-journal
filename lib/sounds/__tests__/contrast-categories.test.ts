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
    expect(vowelIds).toContain("iː-ɪ");
    expect(vowelIds).toContain("uː-ʊ");
    expect(vowelIds).toContain("æ-ʌ");
    expect(vowelIds).toContain("æ-ɛ");
    expect(vowelIds.length).toBeGreaterThanOrEqual(7);
  });

  it("groups consonant-to-consonant contrasts under consonant", () => {
    const grouped = contrastsByCategory(MINIMAL_PAIR_CONTRASTS);
    const consonantIds = grouped.consonant.map((c) => c.id);
    expect(consonantIds).toContain("b-v");
    expect(consonantIds).toContain("v-w");
    expect(consonantIds).toContain("θ-s");
    expect(consonantIds).toContain("θ-t");
    expect(consonantIds).toContain("ð-d");
    expect(consonantIds).toContain("s-z");
    expect(consonantIds).toContain("ʃ-tʃ");
    expect(consonantIds).toContain("ŋ-n");
    expect(consonantIds.length).toBeGreaterThanOrEqual(14);
  });
});
