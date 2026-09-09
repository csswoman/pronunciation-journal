import type { WordCategoryIndex } from "./domain-profile";

/**
 * Which vocabulary *areas* resist the learner, as opposed to which ones they
 * merely save words from.
 *
 * `deriveDomainProfile` already answers "where does this learner collect
 * vocabulary" — it counts saved words. That says nothing about difficulty: a
 * learner who saved 80 backend words and mastered all of them looks identical
 * to one drowning in them. This reads the SM-2 state the word bank already
 * keeps per word and rolls it up to the category, so the coach can aim at a
 * real gap ("backend e infraestructura") instead of a broad label
 * ("Ingeniería").
 *
 * Rolls up to lexicon *categories*, not to the four coarse domains: the
 * categories are the grain a lesson can actually be built around, and they
 * already exist in the catalog — no new topic ids, no second copy of the
 * word bank's truth.
 */

/** Below this ease factor SM-2 is telling us the word keeps being forgotten. */
const STRUGGLING_EASE = 2.2;

/** Statuses where the learner is still fighting the word. */
const UNSETTLED_STATUSES = new Set(["new", "learning", "relearning"]);

/** Fewer than this many hard words in a category is noise, not a weak area. */
const MIN_WORDS = 3;

/** The word_bank columns this needs — a narrow read, not the whole row. */
export interface WeakVocabRow {
  source: string | null;
  source_ref: string | null;
  ease_factor: number | null;
  srs_status: string | null;
}

export interface WeakDomain {
  categoryId: string;
  label: string;
  wordCount: number;
  /** Mean ease factor across the struggling words; lower is harder. */
  averageEase: number;
}

function isStruggling(row: WeakVocabRow): boolean {
  if (!UNSETTLED_STATUSES.has(row.srs_status ?? "")) return false;
  // A null ease factor means SM-2 has not scored it yet. The unsettled status
  // is already evidence, so keep the word and let it sit at the threshold
  // rather than inventing a harshness the data does not support.
  return (row.ease_factor ?? STRUGGLING_EASE) <= STRUGGLING_EASE;
}

/**
 * Aggregates struggling word-bank rows into weak lexicon categories.
 *
 * Pure: the caller supplies the rows, so this is testable without Supabase and
 * reusable if the rows ever arrive from the Dexie mirror instead.
 *
 * A word living in two categories counts in both — the same rule
 * `deriveDomainProfile` uses, since either category is a legitimate place to
 * aim a lesson.
 */
export function deriveWeakDomains(
  rows: readonly WeakVocabRow[],
  wordIndex: WordCategoryIndex,
  categoryNames: ReadonlyMap<string, string>,
): WeakDomain[] {
  const byCategory = new Map<string, { count: number; easeSum: number }>();

  for (const row of rows) {
    if (row.source !== "lexicon" || !row.source_ref) continue;
    if (!isStruggling(row)) continue;

    const categoryIds = wordIndex.get(row.source_ref);
    if (!categoryIds) continue;

    for (const categoryId of categoryIds) {
      const entry = byCategory.get(categoryId) ?? { count: 0, easeSum: 0 };
      entry.count += 1;
      entry.easeSum += row.ease_factor ?? STRUGGLING_EASE;
      byCategory.set(categoryId, entry);
    }
  }

  const weak: WeakDomain[] = [];
  for (const [categoryId, { count, easeSum }] of byCategory) {
    if (count < MIN_WORDS) continue;
    weak.push({
      categoryId,
      label: categoryNames.get(categoryId) ?? categoryId,
      wordCount: count,
      averageEase: easeSum / count,
    });
  }

  // Hardest first: the coach should spend its one topic on the worst gap.
  return weak.sort((a, b) => a.averageEase - b.averageEase);
}
