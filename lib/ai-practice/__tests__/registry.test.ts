import { describe, it, expect } from "vitest";
import { parseToolArgs, isValidToolName, isExerciseTool, TOOL_DECLARATIONS } from "../tools/registry";

describe("isValidToolName", () => {
  it("returns true for all exercise tools", () => {
    expect(isValidToolName("render_multiple_choice")).toBe(true);
    expect(isValidToolName("render_fill_blank")).toBe(true);
    expect(isValidToolName("render_speaking")).toBe(true);
    expect(isValidToolName("render_word_card")).toBe(true);
  });

  it("returns true for all action tools", () => {
    expect(isValidToolName("save_word")).toBe(true);
    expect(isValidToolName("start_roleplay")).toBe(true);
  });

  it("returns false for unknown names", () => {
    expect(isValidToolName("unknown_tool")).toBe(false);
    expect(isValidToolName("")).toBe(false);
    expect(isValidToolName("render_exercise")).toBe(false);
  });
});

describe("isExerciseTool", () => {
  it("returns true for exercise tools", () => {
    expect(isExerciseTool("render_multiple_choice")).toBe(true);
    expect(isExerciseTool("render_word_card")).toBe(true);
  });

  it("returns false for action tools", () => {
    expect(isExerciseTool("save_word")).toBe(false);
    expect(isExerciseTool("start_roleplay")).toBe(false);
  });
});

describe("TOOL_DECLARATIONS", () => {
  it("has a declaration for each of the 6 tools", () => {
    const names = TOOL_DECLARATIONS.map(t => t.name);
    expect(names).toContain("render_multiple_choice");
    expect(names).toContain("render_fill_blank");
    expect(names).toContain("render_speaking");
    expect(names).toContain("render_word_card");
    expect(names).toContain("save_word");
    expect(names).toContain("start_roleplay");
    expect(names).toHaveLength(6);
  });
});

// ─── parseToolArgs ────────────────────────────────────────────────────────────

describe("parseToolArgs — render_multiple_choice", () => {
  const valid = {
    question: "Which article is correct?",
    options: ["a", "an", "the", "—"],
    correctIndex: 2,
    topic: "articles",
  };

  it("parses valid args", () => {
    const result = parseToolArgs("render_multiple_choice", valid);
    expect(result).toMatchObject(valid);
  });

  it("includes optional explanation when present", () => {
    const result = parseToolArgs("render_multiple_choice", { ...valid, explanation: "Because..." });
    expect((result as { explanation?: string }).explanation).toBe("Because...");
  });

  it("omits explanation when absent", () => {
    const result = parseToolArgs("render_multiple_choice", valid);
    expect((result as { explanation?: string }).explanation).toBeUndefined();
  });

  it("throws when question is missing", () => {
    expect(() => parseToolArgs("render_multiple_choice", { ...valid, question: "" })).toThrow();
  });

  it("throws when options has fewer than 2 items", () => {
    expect(() => parseToolArgs("render_multiple_choice", { ...valid, options: ["only one"] })).toThrow();
  });

  it("throws when options has more than 5 items", () => {
    expect(() =>
      parseToolArgs("render_multiple_choice", { ...valid, options: ["a", "b", "c", "d", "e", "f"] })
    ).toThrow();
  });

  it("throws when correctIndex is not an integer", () => {
    expect(() => parseToolArgs("render_multiple_choice", { ...valid, correctIndex: 1.5 })).toThrow();
  });

  it("throws when topic is missing", () => {
    expect(() => parseToolArgs("render_multiple_choice", { ...valid, topic: "" })).toThrow();
  });
});

describe("parseToolArgs — render_fill_blank", () => {
  const valid = { sentence: "I ___ to school.", answer: "go", topic: "present_simple" };

  it("parses valid args", () => {
    const result = parseToolArgs("render_fill_blank", valid);
    expect(result).toMatchObject(valid);
  });

  it("includes acceptableAnswers when present", () => {
    const result = parseToolArgs("render_fill_blank", { ...valid, acceptableAnswers: ["go", "walk"] });
    expect((result as { acceptableAnswers?: string[] }).acceptableAnswers).toEqual(["go", "walk"]);
  });

  it("throws when sentence is empty", () => {
    expect(() => parseToolArgs("render_fill_blank", { ...valid, sentence: "" })).toThrow();
  });

  it("throws when answer is empty", () => {
    expect(() => parseToolArgs("render_fill_blank", { ...valid, answer: "" })).toThrow();
  });
});

describe("parseToolArgs — render_speaking", () => {
  const valid = { prompt: "Say this phrase:", target: "I would like a coffee, please." };

  it("parses valid args", () => {
    const result = parseToolArgs("render_speaking", valid);
    expect(result).toMatchObject(valid);
  });

  it("includes optional ipa", () => {
    const result = parseToolArgs("render_speaking", { ...valid, ipa: "/aɪ wʊd laɪk/" });
    expect((result as { ipa?: string }).ipa).toBe("/aɪ wʊd laɪk/");
  });

  it("throws when prompt is empty", () => {
    expect(() => parseToolArgs("render_speaking", { ...valid, prompt: "" })).toThrow();
  });

  it("throws when target is empty", () => {
    expect(() => parseToolArgs("render_speaking", { ...valid, target: "" })).toThrow();
  });
});

describe("parseToolArgs — render_word_card", () => {
  const valid = { word: "albeit", meaning: "although; even though" };

  it("parses valid args", () => {
    const result = parseToolArgs("render_word_card", valid);
    expect(result).toMatchObject(valid);
  });

  it("throws when word is empty", () => {
    expect(() => parseToolArgs("render_word_card", { ...valid, word: "" })).toThrow();
  });
});

describe("parseToolArgs — save_word", () => {
  it("parses valid args", () => {
    const result = parseToolArgs("save_word", { word: "albeit", meaning: "although" });
    expect(result).toMatchObject({ word: "albeit", meaning: "although" });
  });

  it("throws when meaning is empty", () => {
    expect(() => parseToolArgs("save_word", { word: "albeit", meaning: "" })).toThrow();
  });
});

describe("parseToolArgs — start_roleplay", () => {
  it.each(["interview", "cafe", "airport", "doctor", "store"] as const)(
    'parses scenario "%s"', scenario => {
      const result = parseToolArgs("start_roleplay", { scenario });
      expect((result as { scenario: string }).scenario).toBe(scenario);
    }
  );

  it("throws for invalid scenario", () => {
    expect(() => parseToolArgs("start_roleplay", { scenario: "gym" })).toThrow();
    expect(() => parseToolArgs("start_roleplay", { scenario: "" })).toThrow();
  });
});
