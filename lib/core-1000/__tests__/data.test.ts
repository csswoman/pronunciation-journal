import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { loadCoreWords } from "../data";

function entry(rank: number) {
  return {
    rank,
    word: `word${rank}`,
    pos: "noun",
    ipa_strong: `/wɜrd${rank}/`,
    example_sentence: `This is word${rank}.`,
    cefr_level: "A1",
  };
}

function chunk(n: number, size = 100) {
  return {
    version: 1,
    entries: Array.from({ length: size }, (_, i) => entry((n - 1) * 100 + i + 1)),
  };
}

let tmp: string;
function writeChunks(...chunks: Array<{ n: number; data: unknown }>) {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "core1000-"));
  for (const { n, data } of chunks) {
    fs.writeFileSync(
      path.join(tmp, `words-${String(n).padStart(3, "0")}.json`),
      JSON.stringify(data)
    );
  }
  return tmp;
}

afterEach(() => {
  if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
});

describe("loadCoreWords", () => {
  it("returns [] when the directory has no chunks", () => {
    const dir = writeChunks();
    expect(loadCoreWords(dir)).toEqual([]);
  });

  it("loads contiguous chunks in rank order", () => {
    const dir = writeChunks({ n: 1, data: chunk(1) }, { n: 2, data: chunk(2) });
    const words = loadCoreWords(dir);
    expect(words).toHaveLength(200);
    expect(words[0].rank).toBe(1);
    expect(words[199].rank).toBe(200);
  });

  it("stops at the first missing chunk (contiguous from 001)", () => {
    const dir = writeChunks({ n: 1, data: chunk(1) }, { n: 3, data: chunk(3) });
    expect(loadCoreWords(dir)).toHaveLength(100);
  });

  it("throws in dev on a chunk with wrong size", () => {
    const dir = writeChunks({ n: 1, data: chunk(1, 99) });
    expect(() => loadCoreWords(dir)).toThrow(/100/);
  });

  it("throws in dev on non-contiguous ranks", () => {
    const bad = chunk(1);
    bad.entries[5] = entry(999);
    const dir = writeChunks({ n: 1, data: bad });
    expect(() => loadCoreWords(dir)).toThrow(/rank/i);
  });

  it("throws in dev on Zod-invalid content", () => {
    const bad = chunk(1);
    (bad.entries[0] as Record<string, unknown>).cefr_level = "Z9";
    const dir = writeChunks({ n: 1, data: bad });
    expect(() => loadCoreWords(dir)).toThrow(/Zod/i);
  });
});
