import { fetchEssentialWords } from "@/lib/essential-words/client";
import { buildSessionQueue, matchesFilter, type EssentialWordQueueItem } from "@/lib/essential-words/queue";
import { essentialWordId, NEW_CARDS_PER_DAY, type CefrLevel, type EssentialWordPos, type EssentialWord } from "@/lib/essential-words/types";
import { getEssentialWordsIntroducedToday } from "@/lib/db";
import { prepareEssentialWordsSrsEntries } from "@/lib/essential-words/prepare-srs";
import { phaseForEssentialWordItem, type EssentialWordsPhase } from "@/lib/essential-words/session-model";
import { isVaultEntry } from "@/lib/srs/vault";

export interface EssentialWordsStats {
  totalWords: number;
  learned: number;
  dueCount: number;
  newToday: number;
  newQuota: number;
  vaulted: number;
}

export interface LoadedEssentialWordsQueue {
  items: EssentialWordQueueItem[];
  stats: EssentialWordsStats;
  allWords: EssentialWord[];
  seenIds: Set<string>;
  initialPhase: EssentialWordsPhase;
}

export async function loadEssentialWordsQueue(
  levels?: readonly CefrLevel[] | null,
  pos?: readonly EssentialWordPos[] | null,
  userId?: string,
): Promise<LoadedEssentialWordsQueue> {
  const [words, introducedToday] = await Promise.all([
    fetchEssentialWords(),
    getEssentialWordsIntroducedToday(userId),
  ]);

  const now = new Date();
  const { entries: srsEntries, activatedWordIds } = await prepareEssentialWordsSrsEntries(now, userId);

  const items = buildSessionQueue({ words, srsEntries, introducedToday, now, levels, pos }).map((item) => ({
    ...item,
    fromSnooze: activatedWordIds.includes(essentialWordId(item.entry.word)),
  }));
  const seenIds = new Set(srsEntries.map((entry) => entry.wordId));

  // When a filter is active, scope the "learned x/total" line to that subset so
  // the deck line matches what the user is actually practising.
  const hasFilter = (levels && levels.length > 0) || (pos && pos.length > 0);
  const scopedWords = words.filter((w) => matchesFilter(w, levels, pos));
  const scopedIds = new Set(scopedWords.map((w) => essentialWordId(w.word)));
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
      vaulted: srsEntries.filter(isVaultEntry).length,
    },
    allWords: words,
    seenIds,
    initialPhase: items.length === 0 ? "empty" : phaseForEssentialWordItem(items[0]),
  };
}
