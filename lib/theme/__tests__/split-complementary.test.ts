import { describe, expect, it } from "vitest";
import {
  chromaBoostForHue,
  deriveSplitComplementaryHues,
  normalizeHue,
  splitComplementaryCssVars,
} from "../split-complementary";

describe("split-complementary", () => {
  it("derives accent hues at +150 and +210", () => {
    expect(deriveSplitComplementaryHues(298)).toEqual({
      base: 298,
      accent1: 88,
      accent2: 148,
    });
  });

  it("wraps past 360", () => {
    expect(normalizeHue(370)).toBe(10);
    expect(deriveSplitComplementaryHues(250).accent1).toBe(40);
    expect(deriveSplitComplementaryHues(250).accent2).toBe(100);
  });

  it("boosts chroma in muddy mustard/yellow-green bands", () => {
    expect(chromaBoostForHue(75)).toBeGreaterThan(1);
    expect(chromaBoostForHue(250)).toBe(1);
  });

  it("exposes hue + boost CSS vars", () => {
    const vars = splitComplementaryCssVars(298);
    expect(vars["--hue-base"]).toBe("298");
    expect(vars["--hue-accent-1"]).toBe("88");
    expect(vars["--hue-accent-2"]).toBe("148");
    expect(Number(vars["--chroma-boost-accent-1"])).toBeGreaterThan(1);
  });
});
