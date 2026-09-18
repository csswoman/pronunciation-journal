// Lightweight "learned vs total" counts for the Practice hub's Vocabulary card.
// Uses the compact catalog-index (not the 25MB word dataset) plus a single
// Dexie scans of the user's legacy SRS rows and current learning items. Offline-safe: any failure
// resolves to nulls so the card falls back to a bare title.

import { fetchCatalogIndex } from "@/lib/essential-words/client";
import { getEssentialWordsSrsEntries } from "@/lib/db";
import { getLearningItems } from "@/lib/essential-words/queries";
import { matchesFilter } from "@/lib/essential-words/queue";
import { essentialWordId, type CefrLevel } from "@/lib/essential-words/types";

export interface EssentialWordsLevelCount {
  /** Distinct Essential Words with observed progress, scoped to `levels`. */
  learned: number;
  /** Total Essential Words in the catalog, scoped to `levels`. */
  total: number;
}

/**
 * Returns level-scoped learned/total counts, or null when the data can't be
 * read (Dexie unavailable, catalog fetch failed). Pass `levels = null` for the
 * whole catalog.
 */
export async function getEssentialWordsLevelCount(
  levels: readonly CefrLevel[] | null,
  userId?: string,
): Promise<EssentialWordsLevelCount | null> {
  try {
    const [catalog, progressResult] = await Promise.all([
      fetchCatalogIndex(),
      userId
        ? Promise.all([getEssentialWordsSrsEntries(userId), getLearningItems(userId)])
        : Promise.resolve([[], []] as const),
    ]);

    const scoped = catalog.filter((entry) => matchesFilter(entry, levels, null));
    const total = scoped.length;

    if (!userId) {
      return { learned: 0, total };
    }

    const scopedIds = new Set(scoped.map((entry) => essentialWordId(entry.word)));
    const [srsEntries, learningItems] = progressResult as [
      Awaited<ReturnType<typeof getEssentialWordsSrsEntries>>,
      Awaited<ReturnType<typeof getLearningItems>>,
    ];
    const learnedIds = new Set([
      ...srsEntries
        .filter((entry) => entry.repetitions > 0 || Boolean(entry.lastReview) || entry.status === "mastered")
        .map((entry) => entry.wordId),
      ...learningItems
        .filter((item) => item.schedule.kind !== "none")
        .map((item) => item.wordId),
    ]);
    const learned = [...learnedIds].filter((wordId) => scopedIds.has(wordId)).length;

    return { learned, total };
  } catch {
    return null;
  }
}
