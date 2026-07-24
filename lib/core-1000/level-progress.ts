// Pure per-CEFR-level tally for the Core 1000 dataset. No I/O: the caller
// provides the word list and the set of learned wordIds (from Dexie).

import { CEFR_LEVELS, core1000WordId, type CefrLevel } from "./types";

export interface LevelProgress {
  level: CefrLevel;
  learned: number;
  total: number;
}

/**
 * The only fields tallying reads. Declaring it structurally lets callers pass
 * either a full `CoreWord[]` or the slim projection from `level-index-client`,
 * which is why the home card can fetch ~45KB instead of ~932KB.
 */
export interface LevelTallyWord {
  word: string;
  cefr_level: CefrLevel;
}

/** Counts total and learned words per CEFR level, ordered A1 → C1. */
export function tallyLevelProgress(
  words: readonly LevelTallyWord[],
  learnedIds: Set<string>,
): LevelProgress[] {
  const totals = new Map<CefrLevel, number>();
  const learned = new Map<CefrLevel, number>();

  for (const w of words) {
    totals.set(w.cefr_level, (totals.get(w.cefr_level) ?? 0) + 1);
    if (learnedIds.has(core1000WordId(w.word))) {
      learned.set(w.cefr_level, (learned.get(w.cefr_level) ?? 0) + 1);
    }
  }

  return CEFR_LEVELS.map((level) => ({
    level,
    learned: learned.get(level) ?? 0,
    total: totals.get(level) ?? 0,
  }));
}
