import type { ReorderWordsExercise } from '@/lib/exercises/types'
import type { Sound } from '@/lib/phoneme-practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { normalizeCEFR } from '@/lib/exercises/cefr'
import { exerciseId, isLikelySentence, pick, tokenize } from '@/lib/exercises/utils'
import { VOCABULARY_TOPIC } from '@/lib/practice/topic-labels'
import { shuffleDistinct } from './primitives'

const MIN_TOKENS = 4

/**
 * Generate reorder-words exercises from word bank entries.
 * Requires an example sentence with at least MIN_TOKENS whitespace-separated tokens.
 * The shuffled token order is guaranteed to differ from the original.
 */
export function generateReorderWordsFromWordBank(
  entries: WordBankEntry[],
  count: number
): ReorderWordsExercise[] {
  const usable = entries.filter(e => {
    if (!e.example) return false
    if (!isLikelySentence(e.example)) return false
    return tokenize(e.example).length >= MIN_TOKENS
  })

  return pick(usable, count).map(entry => {
    const sentence = entry.example!
    const tokens = shuffleDistinct(tokenize(sentence))
    const level = entry.difficulty ? normalizeCEFR(entry.difficulty) : undefined

    return {
      id: exerciseId('reorder_words', entry.id, sentence),
      type: 'reorder_words' as const,
      exerciseType: { domain: 'vocabulary', mode: 'reorder', variant: 'sentence' } as const,
      sourceRef: { source: entry.source === 'core1k' ? 'core1k' : 'word_bank', id: entry.id },
      topic: VOCABULARY_TOPIC,
      level,
      sentence,
      tokens,
    }
  })
}

/**
 * Build a reorder-words exercise from the sound's example sentence (phoneme sessions).
 */
export function generateReorderFromSoundExample(sound: Sound): ReorderWordsExercise | null {
  const sentence = sound.example?.trim()
  if (!sentence) return null

  const tokens = tokenize(sentence)
  if (tokens.length < MIN_TOKENS) return null

  return {
    id: exerciseId('reorder_words', String(sound.id), sentence),
    type: 'reorder_words',
    exerciseType: { domain: 'pronunciation', mode: 'reorder', variant: 'sentence' },
    sourceRef: { source: 'words', id: String(sound.id) },
    sentence,
    tokens: shuffleDistinct(tokens),
  }
}
