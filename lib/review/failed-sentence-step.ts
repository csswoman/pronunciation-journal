import { generateReorderWordsFromWordBank } from '@/lib/exercises/generators/reorder-words'
import { generateSentenceDictationFromWordBank } from '@/lib/exercises/generators/sentence-dictation'
import { fromGenericExercise } from '@/lib/practice/adapters'
import { dedupeByContentId } from '@/lib/practice/daily-plan/selectors'
import type { DailyStep, PracticeContext } from '@/lib/practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'

/** Re-drill words tied to recently failed sentence exercises. */
export function buildFailedSentencesStep(
  words: WordBankEntry[],
  context: PracticeContext = 'review',
): DailyStep | null {
  if (words.length === 0) return null

  const dictations = generateSentenceDictationFromWordBank(words, Math.min(2, words.length))
  const reorders = generateReorderWordsFromWordBank(words, 1)
  const exercises = dedupeByContentId([
    ...dictations.map((ex) => fromGenericExercise(ex, context)),
    ...reorders.map((ex) => fromGenericExercise(ex, context)),
  ])

  if (exercises.length === 0) return null

  return {
    kind: 'word_review',
    id: 'failed_sentences',
    title: 'Frases falladas',
    subtitle: `${words.length} ${words.length === 1 ? 'oración' : 'oraciones'} para reforzar`,
    icon: 'FileWarning',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.2)),
  }
}
