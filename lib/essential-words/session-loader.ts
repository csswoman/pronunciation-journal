import { fetchEssentialWords, fetchEssentialWordsForLevel } from "@/lib/essential-words/client";
import { buildSessionQueue, matchesFilter, type EssentialWordQueueItem } from "@/lib/essential-words/queue";
import {
  essentialWordId,
  GUIDED_SESSION_NEW_CARDS,
  type CefrLevel,
  type EssentialWordPos,
  type EssentialWord,
} from "@/lib/essential-words/types";
import { getEssentialWordsIntroducedToday } from "@/lib/db";
import { getEssentialWordLearnerSignals } from "./learner-state-queries";
import { prepareEssentialWordsSrsEntries } from "@/lib/essential-words/prepare-srs";
import { getEssentialWordsDueTomorrowCount } from "@/lib/essential-words/due-tomorrow";
import { phaseForEssentialWordItem, type EssentialWordsPhase } from "@/lib/essential-words/session-model";
import { isVaultEntry } from "@/lib/srs/vault";

export interface EssentialWordsStats {
  totalWords: number;
  learned: number;
  dueCount: number;
  /** Reviews scheduled for the calendar day after today (not today's due count). */
  dueTomorrow: number;
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

/**
 * Loads the dataset for `loadEssentialWordsQueue`. Tries the normal network
 * path first (`fetchEssentialWords()`, unchanged — this is the same call
 * every existing caller already relies on). Only falls back to the
 * offline-pack adapter (Plan 057, Step 4) when that throws AND the caller
 * asked for exactly one level: packs are single-level, so there's no
 * sensible pack to fall back to when `levels` is null/empty (whole catalog)
 * or names more than one level — mixing two levels' packs together, or
 * guessing which of several requested levels to serve, is out of scope here,
 * so those cases simply keep today's behavior and re-throw.
 */
async function loadWordsForQueue(levels?: readonly CefrLevel[] | null): Promise<EssentialWord[]> {
  try {
    return await fetchEssentialWords();
  } catch (err) {
    if (!levels || levels.length !== 1) {
      throw err;
    }
    return fetchEssentialWordsForLevel(levels[0]);
  }
}

export async function loadEssentialWordsQueue(
  levels?: readonly CefrLevel[] | null,
  pos?: readonly EssentialWordPos[] | null,
  userId?: string,
  options?: { maxNewWords?: number },
): Promise<LoadedEssentialWordsQueue> {
  const maxNewWords = options?.maxNewWords ?? GUIDED_SESSION_NEW_CARDS;
  const [words, introducedToday, dueTomorrow, knownClaims] = await Promise.all([
    loadWordsForQueue(levels),
    getEssentialWordsIntroducedToday(userId),
    getEssentialWordsDueTomorrowCount(userId),
    getEssentialWordLearnerSignals(userId),
  ]);

  const now = new Date();
  const { entries: srsEntries, activatedWordIds } = await prepareEssentialWordsSrsEntries(now, userId);

  const items = buildSessionQueue({
    words,
    srsEntries,
    introducedToday,
    now,
    newPerDay: introducedToday.length + maxNewWords,
    levels,
    pos,
    knownClaims,
  }).map((item) => ({
    ...item,
    fromSnooze: activatedWordIds.includes(essentialWordId(item.entry.word)),
  }));
  const seenIds = new Set([
    ...srsEntries.map((entry) => entry.wordId),
    ...knownClaims.filter((claim) => claim.familiarity === "self-declared")
      .map((claim) => claim.wordId),
  ]);

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
      dueTomorrow,
      newToday: introducedToday.length,
      newQuota: maxNewWords,
      vaulted: srsEntries.filter(isVaultEntry).length,
    },
    allWords: words,
    seenIds,
    initialPhase: items.length === 0 ? "empty" : phaseForEssentialWordItem(items[0]),
  };
}
