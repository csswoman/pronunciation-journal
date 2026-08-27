'use client'

// Planned structure:
// <PhonemeExerciseView>
//   {phonemeNode}
//   <SkipButton />
// </PhonemeExerciseView>

import type {
  PhonemePayload,
  PracticeExercise,
  PracticeSubmitHandler,
} from '@/lib/practice/types'
import { toLegacyExercise } from '@/lib/practice/exercise-renderer/legacy-bridge'
import { renderPhonemeExercise } from '@/lib/practice/exercise-renderer/phoneme-registry'
import { UnsupportedExercise } from '@/lib/practice/exercise-renderer/UnsupportedExercise'

interface Props {
  exercise: PracticeExercise & { payload: PhonemePayload }
  onSubmit: PracticeSubmitHandler
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
  /** Hide skip once the learner is in feedback/hints. */
  showSkip?: boolean
}

export function PhonemeExerciseView({
  exercise,
  onSubmit,
  focusUi = false,
  voice,
  showSkip = true,
}: Props) {
  const { slug } = exercise

  function handleSkip() {
    onSubmit(false, 'skip')
  }

  const legacy = toLegacyExercise(exercise)
  const phonemeNode = renderPhonemeExercise({
    legacy,
    exercise,
    onSubmit,
    focusUi,
    voice,
  })

  return (
    <div className="flex w-full flex-col gap-4">
      {phonemeNode ?? <UnsupportedExercise slug={slug} onSkip={handleSkip} />}
      {showSkip && (
        <button
          type="button"
          onClick={handleSkip}
          aria-label="Omitir este ejercicio"
          className="self-center py-2 text-body-sm font-medium text-fg-subtle transition-colors hover:text-fg cursor-pointer focus-ring rounded-md px-3"
        >
          Omitir este ejercicio
        </button>
      )}
    </div>
  )
}
