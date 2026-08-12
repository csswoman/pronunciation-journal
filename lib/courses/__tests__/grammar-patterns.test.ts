import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GrammarStudyDeckSchema } from "@/lib/courses/grammar-deck/schema";
import {
  GRAMMAR_PATTERNS_BY_LEVEL,
  NEW_PATTERN_DECK_SLUGS,
  uniqueDeckSlugsForLevel,
} from "../grammar-patterns";

const decksDir = path.join(process.cwd(), "public", "grammar-decks");

describe("grammar patterns A1–C1", () => {
  it("lists pattern counts per level", () => {
    expect(GRAMMAR_PATTERNS_BY_LEVEL.a1).toHaveLength(28);
    expect(GRAMMAR_PATTERNS_BY_LEVEL.a2).toHaveLength(28);
    expect(GRAMMAR_PATTERNS_BY_LEVEL.b1).toHaveLength(29);
    expect(GRAMMAR_PATTERNS_BY_LEVEL.b2).toHaveLength(25);
    expect(GRAMMAR_PATTERNS_BY_LEVEL.c1).toHaveLength(28);
  });

  it.each(["a1", "a2", "b1", "b2", "c1"] as const)("every %s pattern deck exists and validates", (level) => {
    for (const slug of uniqueDeckSlugsForLevel(level)) {
      const filePath = path.join(decksDir, `${slug}.json`);
      expect(fs.existsSync(filePath), `missing deck for ${slug}`).toBe(true);
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
      expect(GrammarStudyDeckSchema.safeParse(raw).success, `invalid deck ${slug}`).toBe(true);
    }
  });

  it("authored all newly added pattern decks", () => {
    for (const slug of NEW_PATTERN_DECK_SLUGS) {
      expect(fs.existsSync(path.join(decksDir, `${slug}.json`))).toBe(true);
    }
  });
});
