'use client'

import { PickWordExercise } from '@/components/phoneme-practice/PickWordExercise'
import { PickSoundExercise } from '@/components/phoneme-practice/PickSoundExercise'
import { MinimalPairExercise } from '@/components/phoneme-practice/MinimalPairExercise'
import { DictationExercise } from '@/components/phoneme-practice/DictationExercise'
import { SpeakExercise } from '@/components/phoneme-practice/SpeakExercise'
import { MatchPairsExercise } from '@/components/exercises/MatchPairsExercise'
import type { Exercise } from '@/lib/phoneme-practice/types'
import type { MatchPairsExercise as MatchPairsExerciseType } from '@/lib/exercises/types'
import type { PracticeExercise } from '@/lib/practice/types'

interface Props {
  exercise: PracticeExercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

/**
 * Renders the active PracticeExercise by dispatching on slug.
 *
 * Builds the legacy `Exercise` shape from PhonemePayload at the boundary so
 * the underlying components stay untouched.
 */
export function ExerciseRenderer({ exercise, onSubmit }: Props) {
  const { slug, payload, soundId } = exercise

  return (
    <div className="flex flex-col gap-3">
      {renderInner()}
      <button
        type="button"
        onClick={() => onSubmit(false, 'skip')}
        aria-label="Skip this exercise"
        className="self-center rounded-[var(--radius-full)] px-4 py-1.5 text-xs font-medium uppercase tracking-[.08em] text-fg-subtle transition-colors hover:bg-surface-raised hover:text-fg-muted"
      >
        Skip
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
        return <PickWordExercise exercise={legacy} onSubmit={onSubmit} />
      case 'pick_sound':
        return <PickSoundExercise exercise={legacy} onSubmit={onSubmit} />
      case 'minimal_pair':
        return <MinimalPairExercise exercise={legacy} onSubmit={onSubmit} />
      case 'dictation':
        return <DictationExercise exercise={legacy} onSubmit={onSubmit} />
      case 'speak_word':
        return <SpeakExercise exercise={legacy} onSubmit={onSubmit} />
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
  // No standalone UI exists yet for fill_blank / sentence_dictation /
  // reorder_words — the engine should auto-skip these.
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
