import { describe, expect, it } from "vitest";
import { isTypo } from "../typo";

describe("isTypo — semantic criterion, not a length threshold (spec §2.6)", () => {
  it("accepts a doubled-letter typo of a longer word", () => {
    expect(isTypo("hapy", "happy")).toBe(true);
  });

  it("accepts one omitted letter without a word-length threshold", () => {
    expect(isTypo("alredy", "already")).toBe(true);
  });

  it("accepts an adjacent-key typo", () => {
    expect(isTypo("wprk", "work")).toBe(true); // o/p adjacent on QWERTY
  });

  it("accepts a transposition typo", () => {
    expect(isTypo("teh", "the")).toBe(true);
  });

  it("NEVER treats a real dataset collision as a typo, even at distance 1 — 'he' for 'be'", () => {
    expect(isTypo("he", "be")).toBe(false);
  });

  it("NEVER treats 'to' for 'do' as a typo, even at distance 1", () => {
    expect(isTypo("to", "do")).toBe(false);
  });

  it("NEVER treats 'of' for 'on' as a typo, even at distance 1", () => {
    expect(isTypo("of", "on")).toBe(false);
  });

  it("NEVER treats 'in' for 'it' as a typo", () => {
    expect(isTypo("in", "it")).toBe(false);
  });

  it("rejects an answer that is itself a valid, unrelated word at distance > 1", () => {
    expect(isTypo("cat", "dog")).toBe(false);
  });

  it("does not treat a valid word formed by deleting a non-duplicated letter as a typo", () => {
    expect(isTypo("though", "through")).toBe(false);
  });

  it("rejects an exact match (not a typo — it's just correct)", () => {
    expect(isTypo("happy", "happy")).toBe(false);
  });

  it("rejects a completely different word", () => {
    expect(isTypo("banana", "elephant")).toBe(false);
  });

  it("works on words of any length, not just long ones — 'ot' for 'to' is a transposition typo", () => {
    expect(isTypo("ot", "to")).toBe(true);
  });

  it("case-insensitive", () => {
    expect(isTypo("Hapy", "happy")).toBe(true);
    expect(isTypo("HE", "be")).toBe(false);
  });
});
