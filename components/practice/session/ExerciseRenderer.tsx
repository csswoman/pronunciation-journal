'use client'

import type { PracticeExercise } from '@/lib/practice/types'
import {
  isGenericExercise,
  isPhonemeExercise,
} from '@/lib/practice/exercise-renderer/guards'
import { GenericExerciseView } from './GenericExerciseView'
import { PhonemeExerciseView } from './PhonemeExerciseView'

interface Props {
  exercise: PracticeExercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  /** Duolingo-style focus layout for Sound Lab sessions */
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
}

export function ExerciseRenderer({ exercise, onSubmit, focusUi = false, voice }: Props) {
  if (isPhonemeExercise(exercise)) {
    return (
      <PhonemeExerciseView
        exercise={exercise}
        onSubmit={onSubmit}
        focusUi={focusUi}
        voice={voice}
      />
    )
  }

  if (isGenericExercise(exercise)) {
    return (
      <GenericExerciseView
        exercise={exercise}
        onSubmit={onSubmit}
        focusUi={focusUi}
      />
    )
  }

  return null
}
