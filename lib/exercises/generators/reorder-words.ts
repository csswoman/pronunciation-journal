import type { ReorderWordsExercise } from '@/lib/exercises/types'
import type { WordBankEntry } from '@/lib/types'
import type { TextFragment } from '@/lib/exercises/queries'
import { exerciseId, shuffle, tokenize } from '@/lib/exercises/utils'

const MIN_TOKENS = 3
const MAX_TOKENS = 12

function makeReorder(
  sentence: string,
  source: 'text_fragments' | 'word_bank',
  id: string,
  discriminator?: string
): ReorderWordsExercise | null {
  const tokens = tokenize(sentence)
  if (tokens.length < MIN_TOKENS || tokens.length > MAX_TOKENS) return null

  return {
    id: exerciseId('reorder_words', id, discriminator),
    type: 'reorder_words',
    sourceRef: { source, id },
    sentence,
    tokens: shuffle(tokens),
  }
}

/**
 * Generate reorder-words exercises from text_fragments.
 * Uses the full content as the sentence.
 */
export function generateReorderFromFragments(
  fragments: TextFragment[]
): ReorderWordsExercise[] {
  return fragments
    .flatMap(f => {
      // Split multi-sentence fragments into individual sentences
      const sentences = f.content
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(Boolean)

      return sentences.map((s, i) =>
        makeReorder(s, 'text_fragments', f.id, String(i))
      )
    })
    .filter((e): e is ReorderWordsExercise => e !== null)
}

/**
 * Generate reorder-words exercises from word_bank examples.
 */
export function generateReorderFromWordBank(
  words: WordBankEntry[]
): ReorderWordsExercise[] {
  return words
    .filter(w => w.status === 'ready' && w.example)
    .map(w => makeReorder(w.example!, 'word_bank', w.id))
    .filter((e): e is ReorderWordsExercise => e !== null)
}
