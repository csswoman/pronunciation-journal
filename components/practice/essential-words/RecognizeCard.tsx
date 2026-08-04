'use client'

// Planned structure:
// <RecognizeCard>
//   <Prompt />
//   <OptionGrid />
// </RecognizeCard>

import { useMemo, useRef, useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'
import { selectDistractors } from '@/lib/essential-words/distractors'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  /** Translation or meaning — whichever mode selected this card. */
  prompt: string
  /** Words the learner has already seen this session — the distractor pool. */
  distractors: EssentialWord[]
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
}

const OPTION_COUNT = 4

export function RecognizeCard({ entry, prompt, distractors, onAttempt }: Props) {
  const [chosen, setChosen] = useState<string | null>(null)
  const startedAtRef = useRef(Date.now())

  const options = useMemo(() => {
    const wrong = selectDistractors(entry, distractors, [], OPTION_COUNT - 1)
    const all = [entry, ...wrong].map((w) => w.word)
    return all.sort(() => Math.random() - 0.5)
  }, [entry, distractors])

  const handleChoose = (choice: string) => {
    if (chosen) return
    setChosen(choice)
    const isCorrect = choice.toLowerCase() === entry.word.toLowerCase()
    playUiCue(isCorrect ? 'correct' : 'wrong')
    void onAttempt({
      correct: isCorrect,
      hintsUsed: 0, // spec §2.3: multiple choice never offers hints
      rescued: false,
      typo: false,
      firstTryFailed: false,
      latencyMs: Date.now() - startedAtRef.current,
    })
  }

  return (
    <div className="flex w-full flex-col items-center gap-[var(--space-5)] rounded-lg border border-border-subtle bg-surface-raised layout-card-pad">
      <div className="flex max-w-[42ch] flex-col items-center gap-1 text-center">
        <p className="font-kicker m-0 text-fg-muted">¿Qué palabra es?</p>
        <p className="m-0 text-body-lg font-medium leading-relaxed text-balance text-fg">
          {prompt}
        </p>
      </div>

      <div className="grid w-full max-w-sm grid-cols-2 gap-2">
        {options.map((option) => (
          <PillButton
            key={option}
            type="button"
            variant={chosen === option ? 'primary' : 'outline'}
            onClick={() => handleChoose(option)}
            disabled={Boolean(chosen)}
            className={cn(
              chosen &&
                option.toLowerCase() === entry.word.toLowerCase() &&
                'bg-success hover:bg-success',
            )}
          >
            {option}
          </PillButton>
        ))}
      </div>
    </div>
  )
}
