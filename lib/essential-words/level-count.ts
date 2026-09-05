// Lightweight "learned vs total" counts for the Practice hub's Vocabulary card.
// Uses the compact catalog-index (not the 25MB word dataset) plus a single
// Dexie scan of the user's Essential Words SRS rows. Offline-safe: any failure
// resolves to nulls so the card falls back to a bare title.

import { fetchCatalogIndex } from "@/lib/essential-words/client";
import { getEssentialWordsSrsEntries } from "@/lib/db";
import { matchesFilter } from "@/lib/essential-words/queue";
import { essentialWordId, type CefrLevel } from "@/lib/essential-words/types";

export interface EssentialWordsLevelCount {
  /** Distinct Essential Words with an SRS row, scoped to `levels`. */
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
    const [catalog, srsEntries] = await Promise.all([
      fetchCatalogIndex(),
      userId ? getEssentialWordsSrsEntries(userId) : Promise.resolve([]),
    ]);

    const scoped = catalog.filter((entry) => matchesFilter(entry, levels, null));
    const total = scoped.length;

    if (!userId || srsEntries.length === 0) {
      return { learned: 0, total };
    }

    const scopedIds = new Set(scoped.map((entry) => essentialWordId(entry.word)));
    const learned = srsEntries.filter((e) => scopedIds.has(e.wordId)).length;

    return { learned, total };
  } catch {
    return null;
  }
}
