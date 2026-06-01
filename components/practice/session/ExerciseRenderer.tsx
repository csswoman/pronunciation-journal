'use client'

import { PickWordExercise } from '@/components/phoneme-practice/PickWordExercise'
import { PickSoundExercise } from '@/components/phoneme-practice/PickSoundExercise'
import { MinimalPairExercise } from '@/components/phoneme-practice/MinimalPairExercise'
import { DictationExercise } from '@/components/phoneme-practice/DictationExercise'
import { SpeakExercise } from '@/components/phoneme-practice/SpeakExercise'
import { MatchPairsExercise } from '@/components/exercises/MatchPairsExercise'
import { FillBlankExercise } from '@/components/exercises/FillBlankExercise'
import { ReorderWordsExercise } from '@/components/exercises/ReorderWordsExercise'
import { SentenceDictationExercise } from '@/components/exercises/SentenceDictationExercise'
import type { Exercise } from '@/lib/phoneme-practice/types'
import type { MatchPairsExercise as MatchPairsExerciseType, FillBlankExercise as FillBlankExerciseType, ReorderWordsExercise as ReorderWordsExerciseType, SentenceDictationExercise as SentenceDictationExerciseType } from '@/lib/exercises/types'
import type { PracticeExercise } from '@/lib/practice/types'

interface Props {
  exercise: PracticeExercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  /** Duolingo-style focus layout for Sound Lab sessions */
  focusUi?: boolean
}

/**
 * Renders the active PracticeExercise by dispatching on slug.
 *
 * Builds the legacy `Exercise` shape from PhonemePayload at the boundary so
 * the underlying components stay untouched.
 */
export function ExerciseRenderer({ exercise, onSubmit, focusUi = false }: Props) {
  const { slug, payload, soundId } = exercise

  return (
    <div className={focusUi ? undefined : 'flex flex-col gap-4'}>
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
        return <PickSoundExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} />
      case 'minimal_pair':
        return <MinimalPairExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} />
      case 'dictation':
        return <DictationExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} />
      case 'speak_word':
        return <SpeakExercise exercise={legacy} onSubmit={onSubmit} focusUi={focusUi} />
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
  // No standalone UI exists yet for fill_blank / sentence_dictation.
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
