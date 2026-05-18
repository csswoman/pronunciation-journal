import type { FillBlankExercise } from '@/lib/exercises/types'
import type { WordBankEntry } from '@/lib/types'
import { blankWord, exerciseId, pick, shuffle } from '@/lib/exercises/utils'

/**
 * Generate fill-in-the-blank exercises from word_bank entries.
 * Each entry needs `example` (the sentence) and `text` (the answer word).
 */
export function generateFillBlank(words: WordBankEntry[]): FillBlankExercise[] {
  // Only entries with a usable example sentence
  const usable = words.filter(w => w.example && w.text && w.status === 'ready')

  const exercises: FillBlankExercise[] = []

  for (const word of usable) {
    const sentence = blankWord(word.example!, word.text)
    // Skip if the word doesn't appear literally in the example
    if (!sentence) continue

    // Distractors: other words from the bank at a similar difficulty
    const distractorPool = usable
      .filter(w => w.id !== word.id && Math.abs((w.difficulty ?? 0) - (word.difficulty ?? 0)) <= 1)
      .map(w => w.text)

    const distractors = pick(distractorPool, 3)

    // Need at least 2 options total
    if (distractors.length < 1) continue

    const options = shuffle([word.text, ...distractors])

    exercises.push({
      id: exerciseId('fill_blank', word.id),
      type: 'fill_blank',
      sourceRef: { source: 'word_bank', id: word.id },
      sentence,
      answer: word.text,
      options,
      hint: word.meaning ?? word.translation ?? undefined,
      level: undefined,
    })
  }

  return exercises
}
