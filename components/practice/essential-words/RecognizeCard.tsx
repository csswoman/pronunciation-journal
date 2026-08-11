'use client'

// Planned structure:
// <RecognizeCard>
//   <PhaseLabel />
//   <Instruction />
//   <PromptBox />
//   <RecognizeOptionGrid />
//   <InlineFeedback />
//   <ContinueButton />
// </RecognizeCard>

import { useMemo, useRef, useState } from 'react'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { selectDistractors } from '@/lib/essential-words/distractors'
import type { EssentialWordMode } from '@/lib/essential-words/exercise-modes'
import { recognizePromptFor } from '@/lib/essential-words/recognize-prompt'
import { ExercisePhaseLabel } from './ExercisePhaseLabel'
import { RecognizeOptionGrid } from './RecognizeOptionGrid'
import { ArchiveConfirmAction } from '@/components/practice/study-card/ArchiveConfirmAction'
import { InlineFeedback } from '@/components/practice/session/InlineFeedback'
import { useEnterToContinue } from '@/hooks/useEnterToContinue'
import {
  PracticeActionBar,
  PracticeContinueButton,
  PracticeExerciseCard,
} from '@/components/practice/session/PracticeActionBar'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  /** Words the learner has already seen this session — the distractor pool. */
  distractors: EssentialWord[]
  mode?: EssentialWordMode
  levelLabel?: string
  repetitions?: number
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
  /** Present once the choice has been graded — renders the internal
   * "Continuar" action that advances to the next exercise. */
  onContinue?: () => void
  onArchive?: () => void
  isContinuing?: boolean
}

const OPTION_COUNT = 4

export function RecognizeCard({
  entry,
  distractors,
  mode,
  levelLabel,
  repetitions = 0,
  onAttempt,
  onContinue,
  onArchive,
  isContinuing = false,
}: Props) {
  const [chosen, setChosen] = useState<string | null>(null)
  const startedAtRef = useRef(Date.now())

  const cardDistractors = useMemo(
    () => selectDistractors(entry, distractors, [], OPTION_COUNT - 1),
    [entry, distractors],
  )

  const prompt = useMemo(
    () => recognizePromptFor(entry, cardDistractors, repetitions, mode),
    [entry, cardDistractors, repetitions, mode],
  )

  // Keyed on word content (not array reference) so the shuffle stays stable
  // across parent re-renders that recompute `distractors` with a new
  // reference but the same words — otherwise the options jump after choosing.
  const cardDistractorsKey = cardDistractors.map((w) => w.word).join('|')
  const options = useMemo(() => {
    const all = [entry.word, ...cardDistractorsKey.split('|').filter(Boolean)]
    return all.sort(() => Math.random() - 0.5)
  }, [entry.word, cardDistractorsKey])

  const handleChoose = (choice: string) => {
    if (chosen) return
    setChosen(choice)
    const isCorrect = choice.toLowerCase() === entry.word.toLowerCase()
    playUiCue(isCorrect ? 'correct' : 'wrong')
    void onAttempt({
      correct: isCorrect,
      hintsUsed: 0,
      rescued: false,
      typo: false,
      firstTryFailed: false,
      latencyMs: Date.now() - startedAtRef.current,
    })
  }

  useEnterToContinue(Boolean(onContinue && chosen && !isContinuing), onContinue)

  if (!prompt) return null

  return (
    <PracticeExerciseCard className="max-w-md">
      <ExercisePhaseLabel label={levelLabel} />

      <div className="flex w-full flex-col items-center gap-2 text-center">
        <p className="m-0 text-label font-semibold text-fg">{prompt.instruction}</p>
        <p
          className={
            prompt.variant === 'cloze'
              ? 'm-0 max-w-[42ch] text-left text-h3 font-medium leading-relaxed text-pretty text-fg'
              : 'm-0 max-w-[42ch] self-center text-center text-h3 font-medium leading-relaxed text-balance text-fg'
          }
        >
          {prompt.prompt}
        </p>
      </div>

      <RecognizeOptionGrid
        options={options}
        chosen={chosen}
        correctWord={entry.word}
        onChoose={handleChoose}
      />

      {!chosen && onArchive && (
        <div className="flex w-full justify-center pt-space-2">
          <ArchiveConfirmAction onArchive={onArchive} label="Pausar esta palabra" />
        </div>
      )}

      {chosen && (
        <InlineFeedback isCorrect={chosen.toLowerCase() === entry.word.toLowerCase()} />
      )}

      {chosen && onContinue && (
        <PracticeActionBar>
          <PracticeContinueButton onClick={onContinue} disabled={isContinuing} isLoading={isContinuing} />
        </PracticeActionBar>
      )}
    </PracticeExerciseCard>
  )
}
