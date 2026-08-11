// Which example sentence a given review shows. Pure — same rotation contract as
// selectMode (deterministic on word + repetitions), so a re-render never swaps
// the sentence under the learner mid-card.

import type { EssentialWord, SentenceToken, SentenceVariant } from "./types";
import { clozeFor } from "./cloze";
import { isExcludedFromProductionCloze } from "./production-cloze-exclusions";

/** A variant as consumed by cards: IPA is optional because fixtures may omit it. */
export interface ResolvedSentence {
  sentence: string;
  sentence_ipa?: string;
  tokens?: SentenceToken[];
}

/** Deterministic per-word seed. Mirrors exercise-modes.ts — kept local so the
 *  two rotations stay independently tunable. */
function wordSeed(word: string): number {
  let hash = 0;
  for (const char of word) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

function normalizedRepetitions(repetitions: number): number {
  return Number.isFinite(repetitions) ? Math.max(0, Math.floor(repetitions)) : 0;
}

function selectFrom(entry: EssentialWord, pool: ResolvedSentence[], repetitions: number): ResolvedSentence | null {
  if (pool.length === 0) return null;
  const index = (wordSeed(entry.word) + normalizedRepetitions(repetitions)) % pool.length;
  return pool[index];
}

/**
 * Every sentence available for `entry`, base sentence first. Always non-empty:
 * `example_sentence` is mandatory on every entry.
 */
export function sentenceVariants(entry: EssentialWord): ResolvedSentence[] {
  const base: ResolvedSentence = {
    sentence: entry.example_sentence,
    sentence_ipa: entry.sentence_ipa,
    tokens: entry.example_tokens,
  };
  const extra: SentenceVariant[] = entry.example_sentences ?? [];
  return [base, ...extra.filter((v) => v.sentence.trim().length > 0)];
}

/**
 * Pick the sentence for this review. Rotates through the pool as `repetitions`
 * advances so a word reviewed many times is not always drilled on the same
 * sentence. Falls back to the base sentence when nothing else is authored.
 */
export function selectSentence(
  entry: EssentialWord,
  repetitions: number,
): ResolvedSentence {
  const pool = sentenceVariants(entry);
  return selectFrom(entry, pool, repetitions)!;
}

/**
 * Sentence suitable for a written production cloze. Unlike listening, this
 * route has no audio or option pool to disambiguate a plausible synonym, so
 * it excludes the small, editorially-curated set of unsafe contexts.
 */
export function selectProductionClozeSentence(
  entry: EssentialWord,
  repetitions: number,
): ResolvedSentence | null {
  const eligible = sentenceVariants(entry).filter((variant) =>
    !isExcludedFromProductionCloze(entry.word, variant.sentence)
    && clozeFor(entry, variant.sentence) !== null,
  );
  return selectFrom(entry, eligible, repetitions);
}

export function hasProductionClozeSentence(entry: EssentialWord): boolean {
  return selectProductionClozeSentence(entry, 0) !== null;
}
