import type { Exercise, Sound, SoundWord, MinimalPair } from './types'
import type { MatchPairsExercise, ReorderWordsExercise } from '@/lib/exercises/types'
import {
  generatePickWord,
  generatePickSound,
  generateMinimalPair,
  generateDictation,
} from './exercises'
import { generateMatchPairsFromSoundWords } from '@/lib/exercises/generators/match-pairs'
import { generateReorderFromSoundExample } from '@/lib/exercises/generators/reorder-words'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export type MixedExercise =
  | { kind: 'phoneme'; data: Exercise }
  | { kind: 'match_pairs'; data: MatchPairsExercise }
  | { kind: 'reorder_words'; data: ReorderWordsExercise }

/**
 * Build a mixed session for a sound: phoneme exercises + word↔IPA match pairs.
 * Target ~8-10 exercises total.
 */
export function buildMixedSession(
  sound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  pairs: MinimalPair[]
): MixedExercise[] {
  if (targetWords.length === 0) return []

  const phoneme: MixedExercise[] = []

  // 2 pick_word
  for (let i = 0; i < 2; i++) {
    phoneme.push({ kind: 'phoneme', data: generatePickWord(sound, targetWords, allSounds, allWordsBySoundId) })
  }

  // 2 pick_sound
  for (let i = 0; i < 2; i++) {
    phoneme.push({ kind: 'phoneme', data: generatePickSound(sound, targetWords, allSounds) })
  }

  // 2 minimal_pair (or pick_word fallback if no pairs)
  for (let i = 0; i < 2; i++) {
    const mp = generateMinimalPair(sound, pairs)
    phoneme.push({
      kind: 'phoneme',
      data: mp.options.length > 0
        ? mp
        : generatePickWord(sound, targetWords, allSounds, allWordsBySoundId),
    })
  }

  // 2 dictation
  for (let i = 0; i < 2; i++) {
    phoneme.push({ kind: 'phoneme', data: generateDictation(sound, targetWords) })
  }

  // 1-2 match_pairs (word ↔ IPA) if enough words
  const matchGroups = generateMatchPairsFromSoundWords(targetWords)
  if (matchGroups.length > 0) {
    phoneme.push({ kind: 'match_pairs', data: matchGroups[0] })
    if (matchGroups.length > 1) {
      phoneme.push({ kind: 'match_pairs', data: matchGroups[1] })
    }
  }

  const reorder = generateReorderFromSoundExample(sound)
  if (reorder) {
    phoneme.push({ kind: 'reorder_words', data: reorder })
  }

  return shuffle(phoneme)
}
