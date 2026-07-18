import { fetchCoreWords } from "@/lib/core-1000/client";
import { buildSessionQueue, matchesFilter, type Core1000QueueItem } from "@/lib/core-1000/queue";
import { core1000WordId, NEW_CARDS_PER_DAY, type CefrLevel, type CorePos, type CoreWord } from "@/lib/core-1000/types";
import { getCore1000IntroducedToday } from "@/lib/db";
import { prepareCore1000SrsEntries } from "@/lib/core-1000/prepare-srs";
import { phaseForCore1000Item, type EssentialWordsPhase } from "@/lib/core-1000/session-model";

export interface EssentialWordsStats {
  totalWords: number;
  learned: number;
  dueCount: number;
  newToday: number;
  newQuota: number;
}

export interface LoadedEssentialWordsQueue {
  items: Core1000QueueItem[];
  stats: EssentialWordsStats;
  allWords: CoreWord[];
  seenIds: Set<string>;
  initialPhase: EssentialWordsPhase;
}

export async function loadEssentialWordsQueue(
  levels?: readonly CefrLevel[] | null,
  pos?: readonly CorePos[] | null,
): Promise<LoadedEssentialWordsQueue> {
  const [words, introducedToday] = await Promise.all([
    fetchCoreWords(),
    getCore1000IntroducedToday(),
  ]);

  const now = new Date();
  const { entries: srsEntries, activatedWordIds } = await prepareCore1000SrsEntries(now);

  const items = buildSessionQueue({ words, srsEntries, introducedToday, now, levels, pos }).map((item) => ({
    ...item,
    fromSnooze: activatedWordIds.includes(core1000WordId(item.entry.word)),
  }));
  const seenIds = new Set(srsEntries.map((entry) => entry.wordId));

  // When a filter is active, scope the "learned x/total" line to that subset so
  // the deck line matches what the user is actually practising.
  const hasFilter = (levels && levels.length > 0) || (pos && pos.length > 0);
  const scopedWords = words.filter((w) => matchesFilter(w, levels, pos));
  const scopedIds = new Set(scopedWords.map((w) => core1000WordId(w.word)));
  const learned = hasFilter
    ? srsEntries.filter((e) => scopedIds.has(e.wordId)).length
    : srsEntries.length;

  return {
    items,
    stats: {
      totalWords: scopedWords.length,
      learned,
      dueCount: items.filter((item) => item.kind === "review").length,
      newToday: introducedToday.length,
      newQuota: NEW_CARDS_PER_DAY,
    },
    allWords: words,
    seenIds,
    initialPhase: items.length === 0 ? "empty" : phaseForCore1000Item(items[0]),
  };
}
