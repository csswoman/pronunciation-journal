import type { TranslationEsEnExercise } from './types'

function normalize(value: string): string {
  return value.toLocaleLowerCase('en-US').replaceAll('’', "'").replace(/[^a-z0-9'\s]/g, '').replace(/\s+/g, ' ').trim()
}

/** Only explicit reference answers are accepted locally; never infer semantic equivalence. */
export function isExactTranslation(exercise: TranslationEsEnExercise, answer: string): boolean {
  const normalized = normalize(answer)
  return [exercise.referenceEn, ...(exercise.acceptedAnswers ?? [])].some((candidate) => normalize(candidate) === normalized)
}
