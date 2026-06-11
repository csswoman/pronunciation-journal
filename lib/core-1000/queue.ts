// Pure session-queue builder: SM-2 due reviews first, then today's remaining
// quota of new cards in rank order. Pure on purpose — all Dexie I/O lives in
// the caller (useCore1000Session) so this is trivially unit-testable.

import { NEW_CARDS_PER_DAY, core1000WordId, type CoreWord } from "./types";
import type { SRSData } from "@/lib/types";

export interface Core1000QueueItem {
  entry: CoreWord;
  isNew: boolean;
}

export interface BuildQueueOptions {
  words: CoreWord[];          // dataset completo, ordenado por rank
  srsEntries: SRSData[];      // entradas existentes con prefijo c1k:
  introducedToday: string[];  // palabras nuevas ya introducidas hoy
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
  const seen = new Set(srsEntries.map((e) => e.wordId));

  const due: Core1000QueueItem[] = srsEntries
    .filter((e) => new Date(e.nextReview).getTime() <= now.getTime())
    .map((e) => byId.get(e.wordId))
    .filter((entry): entry is CoreWord => entry !== undefined)
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => ({ entry, isNew: false }));

  const quota = Math.max(0, newPerDay - introducedToday.length);
  const fresh: Core1000QueueItem[] = words
    .filter((w) => !seen.has(core1000WordId(w.word)))
    .slice(0, quota)
    .map((entry) => ({ entry, isNew: true }));

  return [...due, ...fresh];
}
