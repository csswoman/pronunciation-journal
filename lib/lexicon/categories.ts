import fs from "fs";
import path from "path";
import type { CategoryMeta, WordEntry } from "./types";

const LEXICON_DIR = path.join(process.cwd(), "public", "lexicon");

export function getCategories(): CategoryMeta[] {
  const indexRaw = fs.readFileSync(path.join(LEXICON_DIR, "index.json"), "utf-8");
  const indexed = new Map<string, CategoryMeta>(
    (JSON.parse(indexRaw) as CategoryMeta[]).map((c) => [c.id, c])
  );

  const ids = fs
    .readdirSync(LEXICON_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .map((f) => path.basename(f, ".json"));

  return ids.map((id) => {
    const words = getCategoryWords(id);
    const base = indexed.get(id) ?? {
      id,
      name: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      color: "#8B8B8B",
      icon: "◆",
      total: 0,
    };
    return { ...base, total: words.length };
  });
}

export function getCategoryWords(categoryId: string): WordEntry[] {
  const filePath = path.join(LEXICON_DIR, `${categoryId}.json`);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as WordEntry[];
}

/** Tags to preview on the lesson card: N random word names. */
export function getPreviewTags(categoryId: string, limit = 6): string[] {
  const words = getCategoryWords(categoryId);
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words.slice(0, limit).map((w) => w.word);
}
