'use client'

// Planned structure:
// <RecognizeCard>
//   <Prompt />
//   <OptionGrid />
// </RecognizeCard>

import { useMemo, useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  /** Translation or meaning — whichever mode selected this card. */
  prompt: string
  /** Other session words used as wrong answers. */
  distractors: EssentialWord[]
  onGraded: (quality: number) => Promise<void>
}

const OPTION_COUNT = 4

/** Quality scores: a clean recognition is a 5, a miss is a lapse (2). */
const CORRECT_QUALITY = 5
const WRONG_QUALITY = 2

export function RecognizeCard({ entry, prompt, distractors, onGraded }: Props) {
  const [chosen, setChosen] = useState<string | null>(null)

  // Dedupe by surface form so the answer never appears twice — same rule as
  // lib/lexicon/exercises.ts.
  const options = useMemo(() => {
    const seen = new Set([entry.word.toLowerCase()])
    const wrong: EssentialWord[] = []
    for (const d of distractors) {
      const key = d.word.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      wrong.push(d)
      if (wrong.length === OPTION_COUNT - 1) break
    }
    const all = [entry, ...wrong].map((w) => w.word)
    // Deterministic-enough shuffle; order only needs to vary per render.
    return all.sort(() => Math.random() - 0.5)
  }, [entry, distractors])

  const handleChoose = (choice: string) => {
    if (chosen) return
    setChosen(choice)
    const isCorrect = choice.toLowerCase() === entry.word.toLowerCase()
    playUiCue(isCorrect ? 'correct' : 'wrong')
    void onGraded(isCorrect ? CORRECT_QUALITY : WRONG_QUALITY)
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
