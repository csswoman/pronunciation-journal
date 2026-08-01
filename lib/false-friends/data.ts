// Loader for the false-friends bank. Mirrors lib/essential-words/client-fetch.ts:
// chunked JSON under public/, fetched lazily, tolerant of missing chunks.

import type { FalseFriendIntro } from "@/lib/practice/study-card/model";
import { FalseFriendChunkSchema } from "./schema";
import type { CefrLevel, FalseFriend } from "./types";
import { CEFR_LEVELS } from "./types";

export const CHUNK_SIZE = 25;
export const MAX_CHUNKS = 8;

function chunkUrl(n: number): string {
  return `/false-friends/pairs-${String(n).padStart(3, "0")}.json`;
}

/**
 * Reads one chunk. A missing chunk ends the walk (returns null); a malformed
 * one throws in dev and is skipped in prod, matching the grammar-deck loader.
 */
async function loadChunk(n: number): Promise<FalseFriend[] | null> {
  const res = await fetch(chunkUrl(n));
  if (!res.ok) return null;

  const result = FalseFriendChunkSchema.safeParse(await res.json());
  if (!result.success) {
    const message = `[false-friends] Validación fallida en ${chunkUrl(n)}`;
    if (process.env.NODE_ENV !== "production") throw new Error(message);
    console.error(message, result.error);
    return [];
  }
  return result.data.entries;
}

/** Loads every authored chunk, in order, stopping at the first gap. */
export async function loadAllFalseFriends(): Promise<FalseFriend[]> {
  const collected: FalseFriend[] = [];

  for (let n = 1; n <= MAX_CHUNKS; n++) {
    const entries = await loadChunk(n);
    if (entries === null) break;
    collected.push(...entries);
  }

  return collected;
}

/** Keeps entries at or below the learner's level, so nothing lands too early. */
export function filterByLevel(entries: FalseFriend[], maxLevel: CefrLevel): FalseFriend[] {
  const ceiling = CEFR_LEVELS.indexOf(maxLevel);
  return entries.filter((e) => CEFR_LEVELS.indexOf(e.cefr_level) <= ceiling);
}

/**
 * Picks `count` entries rotated by `day`, so a learner meets different pairs on
 * different days without any stored cursor. Deterministic: same day → same set.
 */
export function rotateByDay(entries: FalseFriend[], day: number, count: number): FalseFriend[] {
  if (entries.length === 0) return [];

  const start = day % entries.length;
  const picked: FalseFriend[] = [];
  for (let i = 0; i < count && i < entries.length; i++) {
    picked.push(entries[(start + i) % entries.length]);
  }
  return picked;
}

/** Maps an authored pair onto the presentation view model used by the UI. */
export function toFalseFriendIntro(entry: FalseFriend): FalseFriendIntro {
  return {
    word: entry.word,
    looksLike: entry.looksLike,
    actualMeaning: entry.actualMeaning,
    correctWord: entry.correctWord,
    levelBadge: entry.cefr_level,
    note: entry.note,
  };
}

/**
 * Coerces a free-form CEFR estimate ("b2", "B2", undefined) into a level the
 * bank understands. C2 folds into C1 because the bank tops out there, and an
 * unknown estimate defaults to B1 — the band where most false friends bite.
 */
export function normalizeFalseFriendsLevel(raw: string | null | undefined): CefrLevel {
  if (!raw) return "B1";

  const upper = raw.trim().toUpperCase();
  if (upper === "C2") return "C1";
  return (CEFR_LEVELS as readonly string[]).includes(upper) ? (upper as CefrLevel) : "B1";
}

/** Convenience: the day's false friends for a learner at `maxLevel`. */
export async function fetchFalseFriendsForDay(
  day: number,
  count: number,
  maxLevel: CefrLevel,
): Promise<FalseFriend[]> {
  const all = await loadAllFalseFriends();
  return rotateByDay(filterByLevel(all, maxLevel), day, count);
}
