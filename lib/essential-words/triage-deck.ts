import { matchesLevels } from "./queue";
import { essentialWordId, type CefrLevel, type EssentialWord } from "./types";
import type { CatalogIndexEntry } from "./catalog-index";
import type { EssentialWordLearnerSignalRecord } from "@/lib/db";
import type { SRSData } from "@/lib/types";

/**
 * Builds the triage deck for the specified CEFR levels.
 * Only includes words without any prior SRS entry (unseen),
 * sorted by rank ascending.
 */
export function buildTriageDeck(
  words: EssentialWord[],
  srsEntries: SRSData[],
  levels: readonly CefrLevel[],
): EssentialWord[] {
  const seen = new Set(srsEntries.map((e) => e.wordId));

  return words
    .filter((w) => matchesLevels(w, levels) && !seen.has(essentialWordId(w.word)))
    .sort((a, b) => a.rank - b.rank);
}

/** Lightweight triage deck; full word content is loaded only for visible cards. */
export function buildTriageCatalogDeck(
  catalog: CatalogIndexEntry[],
  srsEntries: SRSData[],
  learnerSignals: EssentialWordLearnerSignalRecord[],
  levels: readonly CefrLevel[],
): CatalogIndexEntry[] {
  const seen = new Set(srsEntries.map((entry) => entry.wordId));
  const declaredKnown = new Set(learnerSignals
    .filter((signal) => signal.familiarity === "self-declared")
    .map((signal) => signal.wordId));

  return catalog
    .filter((entry) => {
      const wordId = essentialWordId(entry.word);
      return matchesLevels(entry, levels) && !seen.has(wordId) && !declaredKnown.has(wordId);
    })
    .sort((a, b) => a.rank - b.rank);
}
