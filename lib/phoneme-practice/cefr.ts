/**
 * CEFR level helpers for adapting exercises to user proficiency.
 *
 * The Supabase `words.difficulty` column is an integer (1-5).
 * We map it to CEFR levels so exercises can filter words appropriate
 * to the learner's level.
 *
 *   1 → A1 (beginner, ~basic survival vocabulary)
 *   2 → A2 (elementary, ~everyday topics)
 *   3 → B1 (intermediate, ~clear standard input)
 *   4 → B2 (upper-intermediate, ~complex topics)
 *   5 → C1 (advanced, ~implicit meaning)
 */

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export const CEFR_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1"];

const NUMERIC_TO_CEFR: Record<number, CEFRLevel> = {
  1: "A1",
  2: "A2",
  3: "B1",
  4: "B2",
  5: "C1",
};

const CEFR_TO_NUMERIC: Record<CEFRLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
};

export function numericToCEFR(difficulty: number | null | undefined): CEFRLevel | null {
  if (difficulty == null) return null;
  return NUMERIC_TO_CEFR[difficulty] ?? null;
}

export function cefrToNumeric(level: CEFRLevel): number {
  return CEFR_TO_NUMERIC[level];
}

/**
 * Returns words at or below the given CEFR level.
 * Words with null difficulty are included as a safe fallback.
 */
export function filterByCEFR<T extends { difficulty: number | null }>(
  words: T[],
  maxLevel: CEFRLevel
): T[] {
  const maxNumeric = cefrToNumeric(maxLevel);
  return words.filter(w => w.difficulty == null || w.difficulty <= maxNumeric);
}

/**
 * Pick the simplest words up to `count`. Lower difficulty first; nulls last.
 */
export function pickSimplest<T extends { difficulty: number | null }>(
  words: T[],
  count: number
): T[] {
  return [...words]
    .sort((a, b) => (a.difficulty ?? 99) - (b.difficulty ?? 99))
    .slice(0, count);
}
