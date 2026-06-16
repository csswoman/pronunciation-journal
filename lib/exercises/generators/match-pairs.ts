// match_pairs is only used for phoneme practice (sound_lab), never as a 1-to-1 SRS source
// for word_bank. SRS requires one isCorrect per word; match_pairs grades a group of 4.
import type { MatchPairsExercise, MatchPair } from '@/lib/exercises/types'
import type { SoundWord } from '@/lib/phoneme-practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { exerciseId, pick, shuffle } from '@/lib/exercises/utils'

const PAIRS_PER_EXERCISE = 4

/**
 * Generate match-pairs exercises from phoneme words (word ↔ IPA).
 */
export function generateMatchPairsFromSoundWords(
  soundWords: SoundWord[]
): MatchPairsExercise[] {
  const usable = soundWords.filter(w => w.word && w.ipa)

  const exercises: MatchPairsExercise[] = []
  const shuffled = shuffle(usable)

  for (let i = 0; i < shuffled.length; i += PAIRS_PER_EXERCISE) {
    const group = shuffled.slice(i, i + PAIRS_PER_EXERCISE)
    if (group.length < 2) break

    const pairs: MatchPair[] = group.map(w => ({
      id: String(w.id),
      left: w.word,
      right: w.ipa!,
    }))

    const groupKey = group.map(w => w.id).sort().join(',')
    exercises.push({
      id: exerciseId('match_pairs', groupKey, 'ipa'),
      type: 'match_pairs',
      exerciseType: { domain: 'pronunciation', mode: 'match_pairs', variant: 'phoneme' },
      sourceRef: { source: 'words', id: String(group[0].id) },
      pairs,
    })
  }

  return exercises
}

/** Pick a random subset of exercises. */
export function pickMatchPairs(
  exercises: MatchPairsExercise[],
  count: number
): MatchPairsExercise[] {
  return pick(exercises, count)
}

/**
 * Generate match-pairs exercises from word bank entries (word ↔ definition).
 * Works even when entries have no example sentence.
 * Groups entries into sets of PAIRS_PER_EXERCISE; requires at least 2 entries.
 */
export function generateMatchPairsFromWordBank(
  entries: WordBankEntry[],
  count: number,
): MatchPairsExercise[] {
  const usable = entries.filter((e) => e.text && e.meaning)
  const picked = pick(usable, count * PAIRS_PER_EXERCISE)
  const exercises: MatchPairsExercise[] = []

  for (let i = 0; i < picked.length; i += PAIRS_PER_EXERCISE) {
    const group = picked.slice(i, i + PAIRS_PER_EXERCISE)
    if (group.length < 2) break

    const pairs: MatchPair[] = group.map((e) => ({
      id: e.id,
      left: e.text,
      right: e.meaning!,
    }))

    const groupKey = group.map((e) => e.id).sort().join(',')
    exercises.push({
      id: exerciseId('match_pairs', groupKey, 'definition'),
      type: 'match_pairs',
      exerciseType: { domain: 'vocabulary', mode: 'match_pairs' },
      sourceRef: { source: group[0].source === 'core1k' ? 'core1k' : 'word_bank', id: group[0].id },
      pairs,
    })
  }

  return exercises
}
