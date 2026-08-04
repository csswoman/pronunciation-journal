// Pure per-CEFR-level tally for the Core 1000 dataset. No I/O: the caller
// provides the word list and the set of learned wordIds (from Dexie).

import { CEFR_LEVELS, essentialWordId, type CefrLevel } from "./types";

export interface LevelProgress {
  level: CefrLevel;
  learned: number;
  total: number;
}

export type LevelProgressDisplayRow =
  | { kind: "level"; level: CefrLevel; learned: number; total: number }
  | { kind: "collapsed"; from: CefrLevel; to: CefrLevel };

/**
 * The only fields tallying reads. Declaring it structurally lets callers pass
 * either a full `EssentialWord[]` or the slim projection from `level-index-client`,
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
    if (learnedIds.has(essentialWordId(w.word))) {
      learned.set(w.cefr_level, (learned.get(w.cefr_level) ?? 0) + 1);
    }
  }

  return CEFR_LEVELS.map((level) => ({
    level,
    learned: learned.get(level) ?? 0,
    total: totals.get(level) ?? 0,
  }));
}

/** First incomplete level — where the learner is parked. */
export function currentLevelStatus(rows: readonly LevelProgress[]): string | null {
  const withContent = rows.filter((row) => row.total > 0);
  if (withContent.length === 0) return null;
  const current =
    withContent.find((row) => row.learned < row.total) ?? withContent[withContent.length - 1];
  return `Vas por ${current.level} · ${current.learned} de ${current.total}`;
}

/**
 * Show progressed levels + the next frontier; collapse a trailing streak of
 * unstarted levels so a wall of zeros doesn't read as failure.
 */
export function displayLevelProgress(
  rows: readonly LevelProgress[],
): LevelProgressDisplayRow[] {
  const visible = rows.filter((row) => row.total > 0);
  if (visible.length === 0) return [];

  const result: LevelProgressDisplayRow[] = [];
  let i = 0;

  while (i < visible.length && visible[i].learned > 0) {
    const row = visible[i];
    result.push({ kind: "level", level: row.level, learned: row.learned, total: row.total });
    i += 1;
  }

  if (i < visible.length) {
    const frontier = visible[i];
    result.push({
      kind: "level",
      level: frontier.level,
      learned: frontier.learned,
      total: frontier.total,
    });
    i += 1;
  }

  const rest = visible.slice(i);
  if (rest.length === 0) return result;

  if (rest.every((row) => row.learned === 0) && rest.length >= 2) {
    result.push({
      kind: "collapsed",
      from: rest[0].level,
      to: rest[rest.length - 1].level,
    });
    return result;
  }

  for (const row of rest) {
    result.push({ kind: "level", level: row.level, learned: row.learned, total: row.total });
  }
  return result;
}
