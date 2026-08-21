import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { parseCatalogIndex, type RawCatalogIndex } from "../catalog-index";
import { readChunkEntriesWithChunkIndex, buildCatalogIndex } from "../../../scripts/essential-words/generate-catalog-index.mjs";

describe("catalog-index", () => {
  it("matches the generated chunks", () => {
    const chunkEntries = readChunkEntriesWithChunkIndex();
    const built = buildCatalogIndex(chunkEntries);
    expect(built.entries.length).toBe(chunkEntries.length);

    const parsed = parseCatalogIndex(built);
    expect(parsed.length).toBe(chunkEntries.length);
    expect(parsed[0].word).toBe(chunkEntries[0].word);
    expect(parsed[0].rank).toBe(chunkEntries[0].rank);
    expect(parsed[0].chunk).toBe(1);
  });

  it("public/essential-words/catalog-index.json exists and is valid", () => {
    const filePath = path.join(process.cwd(), "public/essential-words/catalog-index.json");
    expect(fs.existsSync(filePath)).toBe(true);

    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as RawCatalogIndex;
    const parsed = parseCatalogIndex(raw);
    expect(parsed.length).toBeGreaterThanOrEqual(2800);
  });
});
