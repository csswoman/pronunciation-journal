import fs from "fs";
import path from "path";
import { domainForCategory } from "./domains";
import type { CategoryMeta, WordEntry } from "./types";

const LEXICON_DIR = path.join(process.cwd(), "public", "lexicon");

type WordsPageLexicon = {
  categories: CategoryMeta[];
  categoryWordIds: Map<string, string[]>;
  previewTags: Map<string, string[]>;
};

let indexCache: ReadonlyMap<string, CategoryMeta> | undefined;
let categoryIdsCache: readonly string[] | undefined;
let categoriesCache: readonly CategoryMeta[] | undefined;
const wordsByCategory = new Map<string, readonly WordEntry[]>();

function getIndexedCategories(): ReadonlyMap<string, CategoryMeta> {
  if (!indexCache) {
    const indexRaw = fs.readFileSync(path.join(LEXICON_DIR, "index.json"), "utf-8");
    indexCache = new Map(
      (JSON.parse(indexRaw) as CategoryMeta[]).map((category) => [category.id, category])
    );
  }
  return indexCache;
}

function getCategoryIds(): readonly string[] {
  if (!categoryIdsCache) {
    categoryIdsCache = fs
      .readdirSync(LEXICON_DIR)
      .filter((file) => file.endsWith(".json") && file !== "index.json")
      .map((file) => path.basename(file, ".json"));
  }
  return categoryIdsCache;
}

function getCachedCategoryWords(categoryId: string): readonly WordEntry[] {
  const cached = wordsByCategory.get(categoryId);
  if (cached) return cached;

  const filePath = path.join(LEXICON_DIR, `${categoryId}.json`);
  if (!fs.existsSync(filePath)) return [];

  const words = JSON.parse(fs.readFileSync(filePath, "utf-8")) as WordEntry[];
  wordsByCategory.set(categoryId, words);
  return words;
}

export function getCategories(): CategoryMeta[] {
  if (!categoriesCache) {
    const indexed = getIndexedCategories();
    categoriesCache = getCategoryIds().map((id) => {
      const base = indexed.get(id) ?? {
        id,
        name: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        color: "#8B8B8B",
        icon: "◆",
        total: 0,
      };
      return {
        ...base,
        total: getCachedCategoryWords(id).length,
        domain: base.domain ?? domainForCategory(id),
      };
    });
  }
  return categoriesCache.map((category) => ({ ...category }));
}

export function getCategoryWords(categoryId: string): WordEntry[] {
  return getCachedCategoryWords(categoryId).slice();
}

/** Tags to preview on the lesson card: N random word names. */
export function getPreviewTags(categoryId: string, limit = 6): string[] {
  const words = getCachedCategoryWords(categoryId).slice();
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words.slice(0, limit).map((w) => w.word);
}

/** All static lexicon data required to render the Words landing page. */
export function getWordsPageLexicon(previewLimit = 6): WordsPageLexicon {
  const categories = getCategories();
  const categoryWordIds = new Map<string, string[]>();
  const previewTags = new Map<string, string[]>();

  for (const category of categories) {
    const words = getCachedCategoryWords(category.id);
    categoryWordIds.set(category.id, words.map((word) => word.id));
    previewTags.set(category.id, getPreviewTags(category.id, previewLimit));
  }

  return { categories, categoryWordIds, previewTags };
}
