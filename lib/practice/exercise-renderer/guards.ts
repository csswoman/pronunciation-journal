import type { GenericPayload, PhonemePayload, PracticeExercise } from '@/lib/practice/types'

export function isPhonemeExercise(
  exercise: PracticeExercise,
): exercise is PracticeExercise & { payload: PhonemePayload } {
  return exercise.payload.kind === 'phoneme'
}

export function isGenericExercise(
  exercise: PracticeExercise,
): exercise is PracticeExercise & { payload: GenericPayload } {
  return exercise.payload.kind === 'generic'
}
