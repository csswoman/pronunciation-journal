import type { Exercise } from '@/lib/phoneme-practice/types'
import type { PhonemePayload, PracticeExercise } from '@/lib/practice/types'

/** Maps PracticeExercise phoneme payload to the legacy Exercise shape expected by phoneme-practice components. */
export function toLegacyExercise(
  exercise: PracticeExercise & { payload: PhonemePayload },
): Exercise {
  return {
    // Phoneme slugs are a subset of ExerciseSlug; runtime dispatch validates via registry.
    type: exercise.slug as Exercise['type'],
    soundId: exercise.soundId ?? 0,
    ipa: exercise.payload.ipa,
    targetWord: exercise.payload.targetWord,
    options: exercise.payload.options,
    correctIds: exercise.payload.correctIds,
    level: exercise.level,
    stimuli: exercise.payload.stimuli,
    abxAnswer: exercise.payload.abxAnswer,
    oddIndex: exercise.payload.oddIndex,
  }
}
