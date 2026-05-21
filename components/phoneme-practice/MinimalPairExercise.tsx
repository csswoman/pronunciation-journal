'use client'

import { useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

const BASE_OPT =
  'rounded-[var(--radius-xl)] py-5 px-3 text-xl font-bold cursor-pointer transition-all w-full [font-family:inherit] text-center border-[1.5px] hover:-translate-y-[1px] hover:shadow-md'

export function MinimalPairExercise({ exercise, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSelect(id: string) {
    if (submitted) return
    setSelected(id)
    setSubmitted(true)
    const isCorrect = exercise.correctIds.includes(id)
    const label = exercise.options.find(o => o.id === id)?.label ?? ''
    onSubmit(isCorrect, label)
  }

  function getClass(id: string): string {
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect)
        return `${BASE_OPT} bg-success-soft border-success-border text-success ring-2 ring-success/40 hover:translate-y-0 hover:shadow-none`
      if (selected === id)
        return `${BASE_OPT} bg-error-soft border-error-border text-error ring-2 ring-error/40 hover:translate-y-0 hover:shadow-none`
      return `${BASE_OPT} bg-surface-raised border-border-subtle text-fg opacity-40 hover:translate-y-0 hover:shadow-none`
    }
    return `${BASE_OPT} bg-surface-raised border-border-subtle text-fg`
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <p className="text-[15px] text-[var(--text-secondary)] text-center m-0">
        Which word contains
      </p>
      <span className="[font-family:var(--font-phoneme),serif] text-3xl font-bold text-[var(--primary)]">
        {exercise.ipa}
      </span>
      <p className="text-xs text-[var(--text-tertiary)] text-center tracking-[.05em] m-0">
        Tap a word to hear it, then select
      </p>

      <div role="radiogroup" aria-label={`Which word contains ${exercise.ipa}`} className="grid grid-cols-2 gap-3 w-full">
        {exercise.options.map(opt => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected === opt.id}
            aria-label={`Select ${opt.label}`}
            aria-disabled={submitted}
            onClick={() => handleSelect(opt.id)}
            onMouseEnter={() => !submitted && speak(opt.label)}
            className={getClass(opt.id)}
          >
            <div>{opt.label}</div>
            <div aria-hidden className="text-[11px] font-normal mt-1 opacity-50">🔊 hover</div>
          </button>
        ))}
      </div>
    </div>
  )
}
