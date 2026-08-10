// Which example sentence a given review shows. Pure — same rotation contract as
// selectMode (deterministic on word + repetitions), so a re-render never swaps
// the sentence under the learner mid-card.

import type { EssentialWord, SentenceToken, SentenceVariant } from "./types";

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
  if (pool.length === 1) return pool[0];
  const reps = Number.isFinite(repetitions) ? Math.max(0, Math.floor(repetitions)) : 0;
  const index = (wordSeed(entry.word) + reps) % pool.length;
  return pool[index];
}
