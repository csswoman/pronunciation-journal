// Pure session-queue builder. All Dexie I/O lives in the caller so this is
// trivially unit-testable.

import { NEW_CARDS_PER_DAY, essentialWordId, type CefrLevel, type EssentialWordPos, type EssentialWord } from "./types";
import { isDueForQueue } from "@/lib/srs/status";
import type { SRSData } from "@/lib/types";

export interface EssentialWordQueueItem {
  entry: EssentialWord;
  kind: 'new' | 'review' | 'learning';
  fromSnooze?: boolean;
}

export interface BuildQueueOptions {
  words: EssentialWord[];
  srsEntries: SRSData[];       // full c1k rows; caller runs activateExpiredSnoozes first
  introducedToday: string[];
  now: Date;
  newPerDay?: number;
  /** When set (non-empty), restricts both reviews and new cards to these CEFR levels. */
  levels?: readonly CefrLevel[] | null;
  /** When set (non-empty), restricts both reviews and new cards to these parts of speech. */
  pos?: readonly EssentialWordPos[] | null;
}

/** True when `levels` is unset/empty (no filter) or the entry's level is included. */
export function matchesLevels(
  entry: EssentialWord,
  levels?: readonly CefrLevel[] | null,
): boolean {
  if (!levels || levels.length === 0) return true;
  return levels.includes(entry.cefr_level);
}

/** True when `pos` is unset/empty (no filter) or the entry's part of speech is included. */
export function matchesPos(
  entry: EssentialWord,
  pos?: readonly EssentialWordPos[] | null,
): boolean {
  if (!pos || pos.length === 0) return true;
  return pos.includes(entry.pos);
}

/** Combined level + pos predicate — the shape a "themed route" filters on. */
export function matchesFilter(
  entry: EssentialWord,
  levels?: readonly CefrLevel[] | null,
  pos?: readonly EssentialWordPos[] | null,
): boolean {
  return matchesLevels(entry, levels) && matchesPos(entry, pos);
}

export function buildSessionQueue({
  words,
  srsEntries,
  introducedToday,
  now,
  newPerDay = NEW_CARDS_PER_DAY,
  levels,
  pos,
}: BuildQueueOptions): EssentialWordQueueItem[] {
  const byId = new Map(words.map((w) => [essentialWordId(w.word), w]));
  // Every persisted entry counts as seen, including snoozed/mastered. They must
  // not be re-introduced as new after the user presses "Ya la sé".
  const seen = new Set(srsEntries.map((e) => e.wordId));

  // Caller must run activateExpiredSnoozes before buildSessionQueue.
  const due: EssentialWordQueueItem[] = srsEntries
    .filter((e) => isDueForQueue(e, now))
    .map((e) => byId.get(e.wordId))
    .filter((entry): entry is EssentialWord => entry !== undefined)
    .filter((entry) => matchesFilter(entry, levels, pos))
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => ({ entry, kind: 'review' as const }));

  const quota = Math.max(0, newPerDay - introducedToday.length);
  const fresh: EssentialWordQueueItem[] = words
    .filter((w) => !seen.has(essentialWordId(w.word)) && matchesFilter(w, levels, pos))
    .slice(0, quota)
    .map((entry) => ({ entry, kind: 'new' as const }));

  return [...due, ...fresh];
}

/** Re-inserts a failed item ~3 positions ahead as `kind: 'learning'`. Pure. */
export function reinsertLearning(
  queue: EssentialWordQueueItem[],
  index: number,
  item: EssentialWordQueueItem,
): EssentialWordQueueItem[] {
  const learningItem: EssentialWordQueueItem = { ...item, kind: 'learning' };
  const insertAt = Math.min(index + 3, queue.length);
  const result = [...queue];
  result.splice(insertAt, 0, learningItem);
  return result;
}

/** Counts items at/after `index` by kind. Pure. */
export function deriveCounts(
  queue: EssentialWordQueueItem[],
  index: number,
): { newRemaining: number; learningRemaining: number; reviewRemaining: number } {
  const remaining = queue.slice(index);
  return {
    newRemaining: remaining.filter((i) => i.kind === 'new').length,
    learningRemaining: remaining.filter((i) => i.kind === 'learning').length,
    reviewRemaining: remaining.filter((i) => i.kind === 'review').length,
  };
}

/** Appends the next `n` new words by rank to an existing queue. Pure. */
export function appendNewBatch(
  queue: EssentialWordQueueItem[],
  words: EssentialWord[],
  seen: Set<string>,
  n: number = NEW_CARDS_PER_DAY,
  levels?: readonly CefrLevel[] | null,
  pos?: readonly EssentialWordPos[] | null,
): EssentialWordQueueItem[] {
  const inQueue = new Set(queue.map((i) => essentialWordId(i.entry.word)));
  const batch: EssentialWordQueueItem[] = words
    .filter(
      (w) =>
        !seen.has(essentialWordId(w.word)) &&
        !inQueue.has(essentialWordId(w.word)) &&
        matchesFilter(w, levels, pos),
    )
    .slice(0, n)
    .map((entry) => ({ entry, kind: 'new' as const }));
  return [...queue, ...batch];
}
