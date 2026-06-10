'use client'

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
import type { Exercise } from '@/lib/phoneme-practice/types'
import type { MatchPairsExercise as MatchPairsExerciseType, FillBlankExercise as FillBlankExerciseType, ReorderWordsExercise as ReorderWordsExerciseType, SentenceDictationExercise as SentenceDictationExerciseType, SentenceContextExercise as SentenceContextExerciseType, MultipleChoiceExercise as MultipleChoiceExerciseType } from '@/lib/exercises/types'
import type { PracticeExercise } from '@/lib/practice/types'

interface Props {
  exercise: PracticeExercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  /** Duolingo-style focus layout for Sound Lab sessions */
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
}

/**
 * Renders the active PracticeExercise by dispatching on slug.
 *
 * Builds the legacy `Exercise` shape from PhonemePayload at the boundary so
 * the underlying components stay untouched.
 */
export function ExerciseRenderer({ exercise, onSubmit, focusUi = false, voice }: Props) {
  const { slug, payload, soundId } = exercise

  return (
    <div className={focusUi ? 'phoneme-focus__session' : 'flex flex-col gap-4'}>
      {renderInner()}
      <button
        type="button"
        onClick={() => onSubmit(false, 'skip')}
        aria-label="Omitir ejercicio"
        className={focusUi ? 'phoneme-focus__skip' : 'self-center py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)] transition-opacity hover:opacity-70'}
      >
        Omitir
      </button>
    </div>
  )

  function renderInner() {
    if (payload.kind === 'generic') {
      if (slug === 'match_pairs') {
        return (
          <MatchPairsExercise
            exercise={payload.data as MatchPairsExerciseType}
            onSubmit={onSubmit}
          />
        )
      }
      if (slug === 'fill_blank') {
        return (
          <FillBlankExercise
            exercise={payload.data as FillBlankExerciseType}
            onSubmit={(isCorrect, userAnswer) => onSubmit(isCorrect, userAnswer)}
          />
        )
      }
      if (slug === 'reorder_words') {
        return (
          <ReorderWordsExercise
            exercise={payload.data as ReorderWordsExerciseType}
            onSubmit={onSubmit}
            focusUi={focusUi}
          />
        )
      }
      if (slug === 'sentence_dictation') {
        return (
          <SentenceDictationExercise
            exercise={payload.data as SentenceDictationExerciseType}
            onSubmit={(isCorrect, userAnswer) => onSubmit(isCorrect, userAnswer)}
          />
        )
      }
      if (slug === 'sentence_context') {
        return (
          <SentenceContextExercise
            exercise={payload.data as SentenceContextExerciseType}
            onSubmit={onSubmit}
          />
        )
      }
      if (slug === 'multiple_choice') {
        return (
          <MultipleChoiceExercise
            exercise={payload.data as MultipleChoiceExerciseType}
            onSubmit={onSubmit}
          />
        )
      }
      return <UnsupportedExercise slug={slug} onSubmit={onSubmit} />
    }

    const legacy: Exercise = {
      type: slug as Exercise['type'],
      soundId: soundId ?? 0,
      ipa: payload.ipa,
      targetWord: payload.targetWord,
      options: payload.options,
      correctIds: payload.correctIds,
      level: exercise.level,
    }

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
        return <UnsupportedExercise slug={slug} onSubmit={onSubmit} />
    }
  }
}

function UnsupportedExercise({
  slug,
  onSubmit,
}: {
  slug: string
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <p className="text-sm text-fg-subtle">
        This exercise type ({slug}) is not yet available here.
      </p>
      <button
        type="button"
        onClick={() => onSubmit(false, '')}
        className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium bg-surface-raised text-fg-muted"
      >
        Skip
      </button>
    </div>
  )
}
