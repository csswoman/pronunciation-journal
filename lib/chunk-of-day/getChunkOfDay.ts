import { CHUNKS_OF_THE_DAY } from "./data";
import type { ChunkItem } from "./types";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function getDaySeed(date: Date = new Date()): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}

/**
 * Returns a deterministic Chunk of the Day for a given date string or today.
 */
export function getChunkOfDay(dateStr?: string, offset = 0): ChunkItem {
  if (CHUNKS_OF_THE_DAY.length === 0) {
    throw new Error("No chunks available");
  }
  const seed = dateStr ? hashString(dateStr) : getDaySeed();
  const index = Math.abs(seed + offset) % CHUNKS_OF_THE_DAY.length;
  return CHUNKS_OF_THE_DAY[index];
}

/**
 * Returns a random chunk, avoiding immediate repetition of `excludeId`.
 */
export function getRandomChunk(excludeId?: string): ChunkItem {
  if (CHUNKS_OF_THE_DAY.length <= 1) {
    return CHUNKS_OF_THE_DAY[0];
  }
  const candidates = excludeId
    ? CHUNKS_OF_THE_DAY.filter((c) => c.id !== excludeId)
    : CHUNKS_OF_THE_DAY;

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex] || CHUNKS_OF_THE_DAY[0];
}
