// Pure session-queue builder. All Dexie I/O lives in the caller so this is
// trivially unit-testable.

import { NEW_CARDS_PER_DAY, core1000WordId, type CoreWord } from "./types";
import type { SRSData } from "@/lib/types";

export interface Core1000QueueItem {
  entry: CoreWord;
  kind: 'new' | 'review' | 'learning';
}

export interface BuildQueueOptions {
  words: CoreWord[];
  srsEntries: SRSData[];       // already filtered: no archived, no non-c1k
  introducedToday: string[];
  now: Date;
  newPerDay?: number;
}

export function buildSessionQueue({
  words,
  srsEntries,
  introducedToday,
  now,
  newPerDay = NEW_CARDS_PER_DAY,
}: BuildQueueOptions): Core1000QueueItem[] {
  const byId = new Map(words.map((w) => [core1000WordId(w.word), w]));
  // Every persisted entry counts as seen, including archived words. Archived
  // words must not be re-introduced as new after the user presses "Ya la sé".
  const seen = new Set(srsEntries.map((e) => e.wordId));

  const due: Core1000QueueItem[] = srsEntries
    .filter((e) => !e.archived && new Date(e.nextReview).getTime() <= now.getTime())
    .map((e) => byId.get(e.wordId))
    .filter((entry): entry is CoreWord => entry !== undefined)
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => ({ entry, kind: 'review' as const }));

  const quota = Math.max(0, newPerDay - introducedToday.length);
  const fresh: Core1000QueueItem[] = words
    .filter((w) => !seen.has(core1000WordId(w.word)))
    .slice(0, quota)
    .map((entry) => ({ entry, kind: 'new' as const }));

  return [...due, ...fresh];
}

/** Re-inserts a failed item ~3 positions ahead as `kind: 'learning'`. Pure. */
export function reinsertLearning(
  queue: Core1000QueueItem[],
  index: number,
  item: Core1000QueueItem,
): Core1000QueueItem[] {
  const learningItem: Core1000QueueItem = { ...item, kind: 'learning' };
  const insertAt = Math.min(index + 3, queue.length);
  const result = [...queue];
  result.splice(insertAt, 0, learningItem);
  return result;
}

/** Counts items at/after `index` by kind. Pure. */
export function deriveCounts(
  queue: Core1000QueueItem[],
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
  queue: Core1000QueueItem[],
  words: CoreWord[],
  seen: Set<string>,
  n: number = NEW_CARDS_PER_DAY,
): Core1000QueueItem[] {
  const inQueue = new Set(queue.map((i) => core1000WordId(i.entry.word)));
  const batch: Core1000QueueItem[] = words
    .filter((w) => !seen.has(core1000WordId(w.word)) && !inQueue.has(core1000WordId(w.word)))
    .slice(0, n)
    .map((entry) => ({ entry, kind: 'new' as const }));
  return [...queue, ...batch];
}
