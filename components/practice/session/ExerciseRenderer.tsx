'use client'

import type { PracticeExercise, PracticeSubmitHandler } from '@/lib/practice/types'
import {
  isGenericExercise,
  isPhonemeExercise,
} from '@/lib/practice/exercise-renderer/guards'
import { GenericExerciseView } from './GenericExerciseView'
import { PhonemeExerciseView } from './PhonemeExerciseView'

interface Props {
  exercise: PracticeExercise
  onSubmit: PracticeSubmitHandler
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
