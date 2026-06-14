'use client'

import type { PhonemePayload, PracticeExercise } from '@/lib/practice/types'
import { toLegacyExercise } from '@/lib/practice/exercise-renderer/legacy-bridge'
import { renderPhonemeExercise } from '@/lib/practice/exercise-renderer/phoneme-registry'
import { UnsupportedExercise } from '@/lib/practice/exercise-renderer/UnsupportedExercise'

interface Props {
  exercise: PracticeExercise & { payload: PhonemePayload }
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
}

export function PhonemeExerciseView({
  exercise,
  onSubmit,
  focusUi = false,
  voice,
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
    <div className={focusUi ? 'phoneme-focus__session' : 'flex flex-col gap-4'}>
      {phonemeNode ?? <UnsupportedExercise slug={slug} onSkip={handleSkip} />}
      {!focusUi && (
        <button
          type="button"
          onClick={handleSkip}
          aria-label="Skip exercise"
          className="self-center py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] transition-opacity hover:opacity-70"
        >
          Skip
        </button>
      )}
    </div>
  )
}
