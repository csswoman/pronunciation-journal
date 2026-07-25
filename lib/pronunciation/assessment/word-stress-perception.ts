/**
 * Replayable listening items for the word-stress diagnostic.
 *
 * The learner hears one word at a time and identifies its stressed syllable.
 * This is perception evidence only; it does not make a claim about how the
 * learner produces stress in their own recording.
 *
 * A single run samples a fixed subset (WORD_STRESS_ITEMS_PER_RUN) from this
 * bank via the shared seeded PRNG, so repeated diagnostics vary instead of
 * always showing the same items. Scoring is expressed against the number of
 * items actually presented in that run, never the full bank length.
 */

import { createSeededRng, weightedSampleWithoutReplacement } from './seeded-random'

export interface WordStressPerceptionItem {
  word: string
  syllables: readonly string[]
  stressedSyllableIndex: number
}

export const WORD_STRESS_PERCEPTION_ITEMS: readonly WordStressPerceptionItem[] = [
  { word: 'photograph', syllables: ['pho', 'to', 'graph'], stressedSyllableIndex: 0 },
  { word: 'banana', syllables: ['ba', 'na', 'na'], stressedSyllableIndex: 1 },
  { word: 'computer', syllables: ['com', 'pu', 'ter'], stressedSyllableIndex: 1 },
  { word: 'important', syllables: ['im', 'por', 'tant'], stressedSyllableIndex: 1 },
  { word: 'understand', syllables: ['un', 'der', 'stand'], stressedSyllableIndex: 2 },
  { word: 'develop', syllables: ['de', 've', 'lop'], stressedSyllableIndex: 1 },
  { word: 'restaurant', syllables: ['res', 'tau', 'rant'], stressedSyllableIndex: 0 },
  { word: 'tomorrow', syllables: ['to', 'mo', 'rrow'], stressedSyllableIndex: 1 },
  { word: 'remember', syllables: ['re', 'mem', 'ber'], stressedSyllableIndex: 1 },
  { word: 'holiday', syllables: ['ho', 'li', 'day'], stressedSyllableIndex: 0 },
  { word: 'engineer', syllables: ['en', 'gi', 'neer'], stressedSyllableIndex: 2 },
  { word: 'hospital', syllables: ['hos', 'pi', 'tal'], stressedSyllableIndex: 0 },
  { word: 'employee', syllables: ['em', 'plo', 'yee'], stressedSyllableIndex: 2 },
  { word: 'animal', syllables: ['a', 'ni', 'mal'], stressedSyllableIndex: 0 },
  { word: 'experience', syllables: ['ex', 'pe', 'rience'], stressedSyllableIndex: 1 },
  { word: 'family', syllables: ['fa', 'mi', 'ly'], stressedSyllableIndex: 0 },
  { word: 'potato', syllables: ['po', 'ta', 'to'], stressedSyllableIndex: 1 },
  { word: 'necessary', syllables: ['ne', 'ce', 'ssary'], stressedSyllableIndex: 0 },
]

export const WORD_STRESS_PERCEPTION_EVALUATOR_VERSION = 'word-stress-listening-v1'

/** How many word-stress items one diagnostic run presents. */
export const WORD_STRESS_ITEMS_PER_RUN = 5

/**
 * Deterministically samples `count` items from the bank for one run using the
 * shared seeded PRNG. Same seed → same items and order. All items carry equal
 * weight (uniform sample); `weightedSampleWithoutReplacement` guarantees no
 * duplicates and consumes the rng deterministically.
 */
export function sampleWordStressItems(
  seed: number | string,
  count: number = WORD_STRESS_ITEMS_PER_RUN
): WordStressPerceptionItem[] {
  const rng = createSeededRng(seed)
  return weightedSampleWithoutReplacement(WORD_STRESS_PERCEPTION_ITEMS, () => 1, count, rng)
}

/**
 * Converts a correct-answer count into a 0-100 score, relative to the number
 * of items actually presented in the run (`total`), not the full bank size.
 */
export function wordStressScore(correctAnswers: number, total: number): number {
  if (total <= 0) return 0
  const bounded = Math.max(0, Math.min(correctAnswers, total))
  return (bounded / total) * 100
}

/** Inverse of `wordStressScore` for a run of `total` items. */
export function wordStressCorrectAnswers(score: number, total: number): number {
  return Math.round((score / 100) * total)
}
