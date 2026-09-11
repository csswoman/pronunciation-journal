import { describe, it, expect } from "vitest";
import {
  defaultCoachLanguage,
  languagePolicyBlock,
  resolveCoachLanguage,
} from "../coach-language";

describe("defaultCoachLanguage", () => {
  it("uses Spanish scaffolding through A2", () => {
    expect(defaultCoachLanguage("A1")).toBe("es");
    expect(defaultCoachLanguage("A2")).toBe("es");
  });

  it("switches to English from B1 upward", () => {
    expect(defaultCoachLanguage("B1")).toBe("en");
    expect(defaultCoachLanguage("B2")).toBe("en");
    expect(defaultCoachLanguage("C1")).toBe("en");
    expect(defaultCoachLanguage("C2")).toBe("en");
  });
});

describe("resolveCoachLanguage", () => {
  it("follows the level when no preference is set", () => {
    expect(resolveCoachLanguage("A1", null)).toBe("es");
    expect(resolveCoachLanguage("B2", null)).toBe("en");
  });

  it("lets an explicit preference win in both directions", () => {
    expect(resolveCoachLanguage("A1", "en")).toBe("en");
    expect(resolveCoachLanguage("C1", "es")).toBe("es");
  });
});

describe("languagePolicyBlock", () => {
  it("keeps target-language content in English even in the Spanish policy", () => {
    const block = languagePolicyBlock("es");
    expect(block).toContain("Write your prose in SPANISH");
    expect(block).toContain("stays in English");
  });

  it("does not ask for a pre-translated gloss in the English policy", () => {
    expect(languagePolicyBlock("en")).toContain("do not pre-translate");
  });
});
