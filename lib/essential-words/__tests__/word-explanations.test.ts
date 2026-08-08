import { describe, expect, it } from "vitest";
import { explanationFor } from "../word-explanations";

describe("explanationFor — spec §2.5: only when a rule exists", () => {
  it("returns an explanation for 'be' (conjugation rule)", () => {
    expect(explanationFor("be")).toMatch(/am|is|are/i);
  });

  it("returns undefined for a word with no documented rule (most nouns)", () => {
    expect(explanationFor("elephant")).toBeUndefined();
  });

  it("is case-insensitive", () => {
    expect(explanationFor("Be")).toBe(explanationFor("be"));
  });
});
