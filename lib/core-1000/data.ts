// Server-side loader for the Core 1000 dataset.
//
// Chunks live as public/core-1000/words-001.json … words-010.json — outside
// the JS module graph — read from disk and validated with Zod. Mirrors
// lib/courses/grammar-deck/decks.ts: throws loudly in dev, logs + returns []
// in prod. The `fs` import makes this module server-only by construction.

import fs from "fs";
import path from "path";
import { z } from "zod";
import { CoreChunkSchema } from "./schema";
import { CHUNK_SIZE, MAX_CHUNKS, type CoreWord } from "./types";

const DEFAULT_DIR = path.join(process.cwd(), "public", "core-1000");

function chunkPath(dir: string, n: number): string {
  return path.join(dir, `words-${String(n).padStart(3, "0")}.json`);
}

function readAll(dir: string): CoreWord[] {
  const words: CoreWord[] = [];
  for (let n = 1; n <= MAX_CHUNKS; n++) {
    const file = chunkPath(dir, n);
    if (!fs.existsSync(file)) break;

    const data: unknown = JSON.parse(fs.readFileSync(file, "utf-8"));
    const parsed = CoreChunkSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(
        `[core-1000] Zod validation failed for "${file}":\n${z.prettifyError(parsed.error)}`
      );
    }
    const entries = parsed.data.entries;
    if (entries.length !== CHUNK_SIZE) {
      throw new Error(`[core-1000] ${file}: expected ${CHUNK_SIZE} entries, got ${entries.length}`);
    }
    entries.forEach((entry, i) => {
      const expected = (n - 1) * CHUNK_SIZE + i + 1;
      if (entry.rank !== expected) {
        throw new Error(
          `[core-1000] ${file}: rank ${entry.rank} at position ${i}, expected ${expected}`
        );
      }
    });
    words.push(...entries);
  }
  return words;
}

/**
 * Returns every available Core 1000 entry, rank-sorted. Tolerates a partially
 * curated dataset (chunks must be contiguous from 001). Dev: malformed data
 * throws; prod: logs and returns [] so the app degrades gracefully.
 */
export function loadCoreWords(dir: string = DEFAULT_DIR): CoreWord[] {
  try {
    return readAll(dir);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") throw err;
    console.error(String(err));
    return [];
  }
}
