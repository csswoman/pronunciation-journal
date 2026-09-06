import { describe, expect, it } from "vitest";
import {
  buildDeckSuggestUserPrompt,
  buildPhrasesUserPrompt,
  buildSentenceReorderUserPrompt,
  buildWordSearchUserPrompt,
} from "@/lib/ai-prompts";

describe("ai-prompts user builders", () => {
  it("buildPhrasesUserPrompt includes exclude list when provided", () => {
    const prompt = buildPhrasesUserPrompt(["Hello world", "Good morning"]);
    expect(prompt).toContain("Generate 10 English pronunciation practice sentences");
    expect(prompt).toContain("- Hello world");
    expect(prompt).toContain("Do NOT generate");
  });

  it("buildSentenceReorderUserPrompt embeds count, topic, and level", () => {
    const prompt = buildSentenceReorderUserPrompt(5, "travel", "B1");
    expect(prompt).toContain("Generate 5 English sentences");
    expect(prompt).toContain('"travel"');
    expect(prompt).toContain("B1");
  });

  it("buildWordSearchUserPrompt embeds topic, level, count, and known words", () => {
    const prompt = buildWordSearchUserPrompt({
      topic: "kitchen",
      level: "beginner",
      count: 6,
      knownWords: ["knife", "spoon"],
    });
    expect(prompt).toContain("Generate a word search puzzle with 6 words");
    expect(prompt).toContain('"kitchen"');
    expect(prompt).toContain("beginner");
    expect(prompt).toContain("knife, spoon");
  });

  it("buildWordSearchUserPrompt includes exclude list when provided", () => {
    const prompt = buildWordSearchUserPrompt({
      topic: "office",
      level: "intermediate",
      count: 6,
      excludeWords: ["meeting", "agenda"],
    });
    expect(prompt).toContain("Do NOT reuse any of these recently played words: meeting, agenda");
  });

  it("buildDeckSuggestUserPrompt excludes existing deck words", () => {
    const prompt = buildDeckSuggestUserPrompt({
      deckName: "Kitchen",
      deckDescription: "Cooking tools",
      existingWords: ["knife", "spoon"],
    });
    expect(prompt).toContain('Deck: "Kitchen"');
    expect(prompt).toContain("knife, spoon");
    expect(prompt).toContain("do NOT suggest");
  });
});
