// CI gate: public/essential-words/level-index.json must stay in sync with the
// words-*.json chunks it is derived from. Without this, editing a chunk would
// silently leave the home progress card (EssentialWordsProgressCard) showing stale
// per-level totals — the index is fetched instead of the full dataset.
//
// Regenerate with: node scripts/essential-words/generate-level-index.mjs
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { loadEssentialWords } from "../data";
import { tallyLevelProgress } from "../level-progress";

const INDEX_PATH = path.join(process.cwd(), "public", "essential-words", "level-index.json");

interface LevelIndex {
  version: number;
  entries: [string, string][];
}

function loadIndex(): LevelIndex {
  return JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8")) as LevelIndex;
}

describe("Core 1000 level index", () => {
  const words = loadEssentialWords();
  const index = loadIndex();

  it("exists and is versioned", () => {
    expect(index.version).toBe(1);
  });

  it("covers exactly the chunk dataset, in order", () => {
    expect(index.entries.length).toBe(words.length);

    const drift = index.entries
      .map(([word, level], i) => {
        const source = words[i];
        if (source.word === word && source.cefr_level === level) return null;
        return `#${i}: index=[${word}, ${level}] vs chunks=[${source.word}, ${source.cefr_level}]`;
      })
      .filter(Boolean);

    expect(
      drift,
      "level-index.json is stale — run `node scripts/essential-words/generate-level-index.mjs`",
    ).toEqual([]);
  });

  it("produces the same per-level tally as the full dataset", () => {
    const projected = index.entries.map(([word, cefr_level]) => ({
      word,
      cefr_level: cefr_level as (typeof words)[number]["cefr_level"],
    }));
    const learned = new Set<string>();

    expect(tallyLevelProgress(projected, learned)).toEqual(
      tallyLevelProgress(words, learned),
    );
  });

  it("stays far smaller than the full dataset", () => {
    const indexKb = fs.statSync(INDEX_PATH).size / 1024;
    // Guards the whole point of the file: if a future field creeps in and the
    // index approaches the full dataset, the home card regression is back.
    expect(indexKb).toBeLessThan(150);
  });
});
