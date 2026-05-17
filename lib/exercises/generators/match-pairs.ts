import type { MatchPairsExercise, MatchPair } from '@/lib/exercises/types'
import type { WordBankEntry } from '@/lib/types'
import type { SoundWord } from '@/lib/phoneme-practice/types'
import { exerciseId, pick, shuffle } from '@/lib/exercises/utils'

const PAIRS_PER_EXERCISE = 4

/**
 * Generate match-pairs exercises from word_bank entries (word ↔ meaning/translation).
 * Groups entries into sets of PAIRS_PER_EXERCISE.
 */
export function generateMatchPairsFromWordBank(
  words: WordBankEntry[]
): MatchPairsExercise[] {
  const usable = words.filter(
    w => w.status === 'ready' && w.text && (w.meaning || w.translation)
  )

  const exercises: MatchPairsExercise[] = []
  const shuffled = shuffle(usable)

  for (let i = 0; i < shuffled.length; i += PAIRS_PER_EXERCISE) {
    const group = shuffled.slice(i, i + PAIRS_PER_EXERCISE)
    if (group.length < 2) break

    const pairs: MatchPair[] = group.map(w => ({
      id: w.id,
      left: w.text,
      right: w.meaning ?? w.translation ?? '',
    }))

    // Id is based on the sorted ids of the group to be stable
    const groupKey = group.map(w => w.id).sort().join(',')
    exercises.push({
      id: exerciseId('match_pairs', groupKey),
      type: 'match_pairs',
      sourceRef: { source: 'word_bank', id: group[0].id },
      pairs,
    })
  }

  return exercises
}

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
