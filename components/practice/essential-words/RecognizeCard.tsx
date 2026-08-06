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
import { InlineFeedback } from '@/components/practice/session/InlineFeedback'
import Button from '@/components/ui/Button'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (!prompt) return null

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <ExercisePhaseLabel label={levelLabel} />

      <p className="m-0 w-full text-center text-body text-fg">{prompt.instruction}</p>

      <div className="w-full rounded-lg border border-border bg-surface px-4 py-4">
        <p
          className={
            prompt.variant === 'cloze'
              ? 'm-0 text-left text-body-lg leading-relaxed text-pretty text-fg'
              : 'm-0 text-center text-body-lg leading-relaxed text-balance text-fg'
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

      {chosen && (
        <InlineFeedback isCorrect={chosen.toLowerCase() === entry.word.toLowerCase()} />
      )}

      {chosen && onContinue && (
        <Button type="button" variant="primary" size="lg" className="w-full" onClick={onContinue} disabled={isContinuing} isLoading={isContinuing}>
          Continuar
        </Button>
      )}
    </div>
  )
}
