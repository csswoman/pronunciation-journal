import type { ReactNode } from 'react'
import { PickWordExercise } from '@/components/phoneme-practice/PickWordExercise'
import { PickSoundExercise } from '@/components/phoneme-practice/PickSoundExercise'
import { MinimalPairExercise } from '@/components/phoneme-practice/MinimalPairExercise'
import { DictationExercise } from '@/components/phoneme-practice/DictationExercise'
import { SpeakExercise } from '@/components/phoneme-practice/SpeakExercise'
import { SpeakScoredExercise } from '@/components/exercises/SpeakScoredExercise'
import { IdentifyExercise } from '@/components/phoneme-practice/IdentifyExercise'
import { AxSameDifferentExercise } from '@/components/phoneme-practice/AxSameDifferentExercise'
import { OddOneOutExercise } from '@/components/phoneme-practice/OddOneOutExercise'
import { ABXExercise } from '@/components/phoneme-practice/ABXExercise'
import type { Exercise, ExerciseType } from '@/lib/phoneme-practice/types'
import type { PhonemePayload, PracticeExercise } from '@/lib/practice/types'

export type PhonemeRenderContext = {
  legacy: Exercise
  exercise: PracticeExercise & { payload: PhonemePayload }
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
}

type PhonemeRegistryEntry = {
  render: (ctx: PhonemeRenderContext) => ReactNode
}

export const PHONEME_REGISTRY: Record<ExerciseType, PhonemeRegistryEntry> = {
  pick_word: {
    render: ({ legacy, onSubmit, focusUi }) => (
      <PickWordExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} />
    ),
  },
  pick_sound: {
    render: ({ legacy, onSubmit, focusUi, voice }) => (
      <PickSoundExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} voice={voice} />
    ),
  },
  minimal_pair: {
    render: ({ legacy, onSubmit, focusUi, voice }) => (
      <MinimalPairExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} voice={voice} />
    ),
  },
  dictation: {
    render: ({ legacy, onSubmit, voice }) => (
      <DictationExercise exercise={legacy} onSubmit={onSubmit} voice={voice} />
    ),
  },
  speak_word: {
    render: ({ legacy, exercise, onSubmit, focusUi }) =>
      exercise.context === 'daily'
        ? <SpeakScoredExercise exercise={legacy} onSubmit={onSubmit} />
        : <SpeakExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} />,
  },
  identify: {
    render: ({ legacy, onSubmit, voice }) => (
      <IdentifyExercise exercise={legacy} onSubmit={onSubmit} voice={voice} />
    ),
  },
  ax_same_different: {
    render: ({ legacy, onSubmit, voice }) => (
      <AxSameDifferentExercise exercise={legacy} onSubmit={onSubmit} voice={voice} />
    ),
  },
  odd_one_out: {
    render: ({ legacy, onSubmit, voice }) => (
      <OddOneOutExercise exercise={legacy} onSubmit={onSubmit} voice={voice} />
    ),
  },
  abx: {
    render: ({ legacy, onSubmit, voice }) => (
      <ABXExercise exercise={legacy} onSubmit={onSubmit} voice={voice} />
    ),
  },
}

export function renderPhonemeExercise(ctx: PhonemeRenderContext): ReactNode {
  const entry = PHONEME_REGISTRY[ctx.legacy.type]
  return entry?.render(ctx) ?? null
}
