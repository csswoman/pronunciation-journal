import type { TranslationEsEnExercise } from './types'

import { matchesAcceptedAnswer } from './grading-pipeline'

/** Every answer the exercise itself declares valid, reference first. */
export function translationAnswers(exercise: TranslationEsEnExercise): string[] {
  return [exercise.referenceEn, ...(exercise.acceptedAnswers ?? [])]
}

/** Only explicit reference answers are accepted locally; never infer semantic equivalence. */
export function isExactTranslation(exercise: TranslationEsEnExercise, answer: string): boolean {
  return matchesAcceptedAnswer(answer, translationAnswers(exercise))
}
