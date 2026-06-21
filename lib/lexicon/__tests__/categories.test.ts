import fs from "fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const LEXICON_DIR = path.join(process.cwd(), "public", "lexicon");
const categoryFileCount = fs
  .readdirSync(LEXICON_DIR)
  .filter((file) => file.endsWith(".json") && file !== "index.json").length;

describe("lexicon category cache", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads and parses each lexicon file once for the complete read model", async () => {
    const readFile = vi.spyOn(fs, "readFileSync");
    const readDirectory = vi.spyOn(fs, "readdirSync");
    const { getWordsPageLexicon } = await import("../categories");

    const first = getWordsPageLexicon();
    const readsAfterWarmup = readFile.mock.calls.length;
    const directoryReadsAfterWarmup = readDirectory.mock.calls.length;
    const second = getWordsPageLexicon();

    expect(first.categories).toHaveLength(categoryFileCount);
    expect(first.categoryWordIds.size).toBe(categoryFileCount);
    expect(first.previewTags.size).toBe(categoryFileCount);
    expect(readsAfterWarmup).toBe(categoryFileCount + 1);
    expect(directoryReadsAfterWarmup).toBe(1);
    expect(readFile).toHaveBeenCalledTimes(readsAfterWarmup);
    expect(readDirectory).toHaveBeenCalledTimes(directoryReadsAfterWarmup);
    expect(second.categories).toEqual(first.categories);
  });

  it("preserves category totals and the source word order", async () => {
    const { getCategories, getCategoryWords } = await import("../categories");
    const categories = getCategories();

    for (const category of categories) {
      const words = getCategoryWords(category.id);
      const source = JSON.parse(
        fs.readFileSync(path.join(LEXICON_DIR, `${category.id}.json`), "utf-8")
      ) as Array<{ id: string }>;

      expect(category.total).toBe(source.length);
      expect(words.map((word) => word.id)).toEqual(source.map((word) => word.id));
    }
  });

  it("returns an empty array for a missing category without reading a file", async () => {
    const readFile = vi.spyOn(fs, "readFileSync");
    const { getCategoryWords } = await import("../categories");

    expect(getCategoryWords("does-not-exist")).toEqual([]);
    expect(readFile).not.toHaveBeenCalled();
  });

  it("does not expose or mutate the cached canonical word array", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { getCategories, getCategoryWords, getPreviewTags } = await import("../categories");
    const categoryId = getCategories()[0].id;
    const original = getCategoryWords(categoryId);
    const expectedIds = original.map((word) => word.id);

    original.reverse();
    getPreviewTags(categoryId, 6);

    expect(getCategoryWords(categoryId).map((word) => word.id)).toEqual(expectedIds);
  });
});
