// Server-side loader for the Core 1000 dataset.
//
// Chunks live as public/essential-words/words-001.json … words-010.json — outside
// the JS module graph — read from disk and validated with Zod. Mirrors
// lib/courses/grammar-deck/decks.ts: throws loudly in dev, logs + returns []
// in prod. The `fs` import makes this module server-only by construction.

import fs from "fs";
import path from "path";
import { z } from "zod";
import { EssentialWordChunkSchema } from "./schema";
import { CHUNK_SIZE, MAX_CHUNKS, type EssentialWord } from "./types";

const DEFAULT_DIR = path.join(process.cwd(), "public", "essential-words");

function chunkPath(dir: string, n: number): string {
  return path.join(dir, `words-${String(n).padStart(3, "0")}.json`);
}

function readAll(dir: string): EssentialWord[] {
  const words: EssentialWord[] = [];
  for (let n = 1; n <= MAX_CHUNKS; n++) {
    const file = chunkPath(dir, n);
    if (!fs.existsSync(file)) break;

    const data: unknown = JSON.parse(fs.readFileSync(file, "utf-8"));
    const parsed = EssentialWordChunkSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(
        `[essential-words] Zod validation failed for "${file}":\n${z.prettifyError(parsed.error)}`
      );
    }
    const entries = parsed.data.entries;
    if (entries.length !== CHUNK_SIZE) {
      throw new Error(`[essential-words] ${file}: expected ${CHUNK_SIZE} entries, got ${entries.length}`);
    }
    entries.forEach((entry, i) => {
      const expected = (n - 1) * CHUNK_SIZE + i + 1;
      if (entry.rank !== expected) {
        throw new Error(
          `[essential-words] ${file}: rank ${entry.rank} at position ${i}, expected ${expected}`
        );
      }
    });
    words.push(...entries);
  }
  return words;
}

const wordsCache = new Map<string, EssentialWord[]>();

export function clearEssentialWordsCache(): void {
  wordsCache.clear();
  essentialWordsMap = null;
}

/**
 * Returns every available Core 1000 entry, rank-sorted. Tolerates a partially
 * curated dataset (chunks must be contiguous from 001). Dev: malformed data
 * throws; prod: logs and returns [] so the app degrades gracefully.
 */
export function loadEssentialWords(dir: string = DEFAULT_DIR): EssentialWord[] {
  if (wordsCache.has(dir)) {
    return wordsCache.get(dir)!;
  }
  try {
    const words = readAll(dir);
    wordsCache.set(dir, words);
    return words;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") throw err;
    console.error(String(err));
    return [];
  }
}

let essentialWordsMap: Map<string, EssentialWord> | null = null;

/**
 * Fast O(1) in-memory lookup for essential words by lowercased text.
 * Cached across requests in the Node server environment.
 */
export function findEssentialWord(text: string, dir: string = DEFAULT_DIR): EssentialWord | null {
  if (!essentialWordsMap) {
    const map = new Map<string, EssentialWord>();
    const all = loadEssentialWords(dir);
    for (const item of all) {
      if (item.word) {
        map.set(item.word.toLowerCase().trim(), item);
      }
    }
    essentialWordsMap = map;
  }
  return essentialWordsMap.get(text.toLowerCase().trim()) ?? null;
}


