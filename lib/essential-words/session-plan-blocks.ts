// Block construction for Fase A (spec §1.1). A block is 3 or 4 words, never
// 1 or 2 — repeating the same word back-to-back resolves from working
// memory, not long-term recall. Pure: no I/O, deterministic per seed.

import { essentialWordId } from "./types";
import type { EssentialWord } from "./types";
import type { Block } from "./session-plan-types";

/**
 * Partition `n` words into block sizes of 3 or 4 per spec §1.1:
 *   n % 3 == 0  ->  all blocks of 3
 *   n % 3 == 1  ->  all blocks of 3 except the last, which takes 4
 *   n % 3 == 2  ->  redistribute: no block of 2. Take 4s from the tail until
 *                   the remainder resolves to a clean multiple of 3 (or 0).
 *
 * n < 3 produces no blocks — the caller carries the leftover into a resumed
 * or combined-with-reviews session rather than starting a degenerate block
 * (spec §4.1: "si no cabe un bloque completo de 3, no se empieza").
 */
export function blockSizes(n: number): number[] {
  if (n < 3) return [];
  const mod = n % 3;
  if (mod === 0) return Array(n / 3).fill(3);
  if (mod === 1) {
    const threes = (n - 4) / 3;
    return [...Array(threes).fill(3), 4];
  }
  if (n < 8) return [4];
  const fours = 2;
  const remainderAfterFours = n - fours * 4;
  const threes = Math.floor(remainderAfterFours / 3);
  return [...Array(threes).fill(3), 4, 4];
}

/** Build ordered blocks from `words`, preserving input order. */
export function buildBlocks(words: EssentialWord[], seed: number): Block[] {
  void seed;
  const sizes = blockSizes(words.length);
  const blocks: Block[] = [];
  let offset = 0;
  for (const size of sizes) {
    const chunk = words.slice(offset, offset + size);
    offset += size;
    const wordIds = chunk.map((w) => essentialWordId(w.word));
    blocks.push({
      wordIds,
      levelReached: Object.fromEntries(wordIds.map((id) => [id, 0])),
      failCount: Object.fromEntries(wordIds.map((id) => [id, 0])),
      exposed: new Set(),
    });
  }
  return blocks;
}

/** Words left over after blocking (fewer than 3 remain). */
export function leftoverWords(words: EssentialWord[]): EssentialWord[] {
  const blocked = blockSizes(words.length).reduce((a, b) => a + b, 0);
  return words.slice(blocked);
}
