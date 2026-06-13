'use client'

import { useState, useEffect } from 'react'
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
import { MatchPairsExercise } from '@/components/exercises/MatchPairsExercise'
import { FillBlankExercise } from '@/components/exercises/FillBlankExercise'
import { ReorderWordsExercise } from '@/components/exercises/ReorderWordsExercise'
import { SentenceDictationExercise } from '@/components/exercises/SentenceDictationExercise'
import { SentenceContextExercise } from '@/components/lexicon/SentenceContextExercise'
import { MultipleChoiceExercise } from '@/components/exercises/MultipleChoiceExercise'
import { ExerciseShell } from '@/components/exercises/ExerciseShell'
import type { ExerciseResult } from '@/components/exercises/ExerciseShell'
import type { Exercise } from '@/lib/phoneme-practice/types'
import type {
  MatchPairsExercise as MatchPairsExerciseType,
  FillBlankExercise as FillBlankExerciseType,
  ReorderWordsExercise as ReorderWordsExerciseType,
  SentenceDictationExercise as SentenceDictationExerciseType,
  SentenceContextExercise as SentenceContextExerciseType,
  MultipleChoiceExercise as MultipleChoiceExerciseType,
} from '@/lib/exercises/types'
import type { PracticeExercise } from '@/lib/practice/types'

interface Props {
  exercise: PracticeExercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  /** Duolingo-style focus layout for Sound Lab sessions */
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
}

const EXERCISE_TITLES: Record<string, string> = {
  sentence_dictation: 'Listen and type',
  fill_blank: 'Complete the sentence',
  reorder_words: 'Put in order',
  multiple_choice: 'Choose the correct answer',
  sentence_context: 'Choose the best option',
  match_pairs: 'Match the pairs',
}

export function ExerciseRenderer({ exercise, onSubmit, focusUi = false, voice }: Props) {
  const { slug, payload, soundId } = exercise
  const [result, setResult] = useState<ExerciseResult | null>(null)

  useEffect(() => {
    setResult(null)
  }, [exercise.id])

  function handleResult(isCorrect: boolean, userAnswer: string, timeMs: number) {
    setResult({ isCorrect, userAnswer, timeMs })
  }

  function handleContinue() {
    if (!result) return
    onSubmit(result.isCorrect, result.userAnswer)
  }

  function handleSkip() {
    onSubmit(false, 'skip')
  }

  if (payload.kind !== 'generic') {
    return renderPhoneme()
  }

  const title = EXERCISE_TITLES[slug] ?? slug
  const hint = getHint(slug, payload.data)

  return (
    <div className={focusUi ? 'phoneme-focus__session' : 'flex flex-col gap-4'}>
      <ExerciseShell
        title={title}
        hint={hint}
        result={result}
        onContinue={handleContinue}
        onSkip={handleSkip}
      >
        {renderGeneric()}
      </ExerciseShell>
    </div>
  )

  function getHint(exerciseSlug: string, data: unknown): { word: string; meaning?: string } | undefined {
    if (exerciseSlug === 'sentence_dictation') {
      const d = data as SentenceDictationExerciseType
      if (d.targetWord) return { word: d.targetWord, meaning: d.targetMeaning }
    }
    if (exerciseSlug === 'fill_blank') {
      const d = data as FillBlankExerciseType
      if (d.hint) return { word: d.hint }
    }
    return undefined
  }

  function renderGeneric() {
    const genericPayload = payload as any
    if (slug === 'match_pairs') {
      return (
        <MatchPairsExercise
          exercise={genericPayload.data as MatchPairsExerciseType}
          onResult={handleResult}
        />
      )
    }
    if (slug === 'fill_blank') {
      return (
        <FillBlankExercise
          exercise={genericPayload.data as FillBlankExerciseType}
          onResult={handleResult}
        />
      )
    }
    if (slug === 'reorder_words') {
      return (
        <ReorderWordsExercise
          exercise={genericPayload.data as ReorderWordsExerciseType}
          onResult={handleResult}
          focusUi={focusUi}
        />
      )
    }
    if (slug === 'sentence_dictation') {
      return (
        <SentenceDictationExercise
          exercise={genericPayload.data as SentenceDictationExerciseType}
          onResult={handleResult}
        />
      )
    }
    if (slug === 'sentence_context') {
      return (
        <SentenceContextExercise
          exercise={genericPayload.data as SentenceContextExerciseType}
          onResult={handleResult}
        />
      )
    }
    if (slug === 'multiple_choice') {
      return (
        <MultipleChoiceExercise
          exercise={genericPayload.data as MultipleChoiceExerciseType}
          onResult={handleResult}
        />
      )
    }
    return <UnsupportedExercise slug={slug} onSkip={handleSkip} />
  }

  function renderPhoneme() {
    const phonemePayload = payload as any
    const legacy: Exercise = {
      type: slug as Exercise['type'],
      soundId: soundId ?? 0,
      ipa: phonemePayload.ipa,
      targetWord: phonemePayload.targetWord,
      options: phonemePayload.options,
      correctIds: phonemePayload.correctIds,
      level: exercise.level,
    }

    const phonemeNode = (() => {
      switch (slug) {
        case 'pick_word':
          return <PickWordExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} />
        case 'pick_sound':
          return <PickSoundExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} voice={voice} />
        case 'minimal_pair':
          return <MinimalPairExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} voice={voice} />
        case 'dictation':
          return <DictationExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} voice={voice} />
        case 'speak_word':
          return exercise.context === 'daily'
            ? <SpeakScoredExercise exercise={legacy} onSubmit={onSubmit} />
            : <SpeakExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} />
        case 'identify':
          return <IdentifyExercise exercise={legacy} onSubmit={onSubmit} voice={voice} />
        case 'ax_same_different':
          return <AxSameDifferentExercise exercise={legacy} onSubmit={onSubmit} voice={voice} />
        case 'odd_one_out':
          return <OddOneOutExercise exercise={legacy} onSubmit={onSubmit} voice={voice} />
        case 'abx':
          return <ABXExercise exercise={legacy} onSubmit={onSubmit} voice={voice} />
        default:
          return <UnsupportedExercise slug={slug} onSkip={handleSkip} />
      }
    })()

    return (
      <div className={focusUi ? 'phoneme-focus__session' : 'flex flex-col gap-4'}>
        {phonemeNode}
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
}

function UnsupportedExercise({ slug, onSkip }: { slug: string; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <p className="text-sm text-fg-subtle">
        This exercise type ({slug}) is not yet available here.
      </p>
      <button
        type="button"
        onClick={onSkip}
        className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium bg-surface-raised text-fg-muted"
      >
        Skip
      </button>
    </div>
  )
}
