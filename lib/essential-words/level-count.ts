// Lightweight "learned vs total" counts for the Practice hub's Vocabulary card.
// Uses the compact catalog-index (not the 25MB word dataset) plus a single
// Dexie scan of the user's canonical learning items. Offline-safe: any failure
// resolves to nulls so the card falls back to a bare title.

import { fetchCatalogIndex } from "@/lib/essential-words/client";
import { getLearningItems } from "@/lib/essential-words/queries";
import { matchesFilter } from "@/lib/essential-words/queue";
import { essentialWordId, type CefrLevel } from "@/lib/essential-words/types";
import { summarizeEssentialWordsProgress } from "@/lib/essential-words/progress-summary";

export interface EssentialWordsLevelCount {
  /** Distinct Essential Words with observed progress, scoped to `levels`. */
  learned: number;
  /** Total Essential Words in the catalog, scoped to `levels`. */
  total: number;
  /** Distinct Essential Words currently due, scoped to `levels`. */
  due: number;
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
    const [catalog, learningItems] = await Promise.all([
      fetchCatalogIndex(),
      userId ? getLearningItems(userId) : Promise.resolve([]),
    ]);

    const scoped = catalog.filter((entry) => matchesFilter(entry, levels, null));
    const total = scoped.length;

    if (!userId) {
      return { learned: 0, total, due: 0 };
    }

    const scopedIds = new Set(scoped.map((entry) => essentialWordId(entry.word)));
    const progress = summarizeEssentialWordsProgress(learningItems, new Date(), scopedIds);

    return { learned: progress.studiedWords, total, due: progress.dueWords };
  } catch {
    return null;
  }
}
