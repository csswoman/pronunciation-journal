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
  /** Immersive focus layout (phone shell) for practice sessions */
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
  showSkip?: boolean
}

export function ExerciseRenderer({
  exercise,
  onSubmit,
  focusUi = false,
  voice,
  showSkip = true,
}: Props) {
  if (isPhonemeExercise(exercise)) {
    return (
      <PhonemeExerciseView
        exercise={exercise}
        onSubmit={onSubmit}
        focusUi={focusUi}
        voice={voice}
        showSkip={showSkip}
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
