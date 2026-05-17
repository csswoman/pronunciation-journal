'use client'

import { useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

const BASE_OPT = 'rounded-[var(--radius-xl)] py-5 px-3 text-xl font-bold cursor-pointer transition-all w-full [font-family:inherit] text-center border-[1.5px]'

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
      if (isCorrect) return `${BASE_OPT} bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--success)]`
      if (selected === id) return `${BASE_OPT} bg-[var(--error-soft)] border-[var(--error-border)] text-[var(--error)]`
      return `${BASE_OPT} bg-[var(--surface-raised)] border-[var(--border-subtle)] text-[var(--text-primary)] opacity-[0.45]`
    }
    return `${BASE_OPT} bg-[var(--surface-raised)] border-[var(--border-subtle)] text-[var(--text-primary)]`
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

      <div className="grid grid-cols-2 gap-3 w-full">
        {exercise.options.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => handleSelect(opt.id)}
            onMouseEnter={() => !submitted && speak(opt.label)}
            className={getClass(opt.id)}
          >
            <div>{opt.label}</div>
            <div className="text-[11px] font-normal mt-1 opacity-50">🔊 hover</div>
          </button>
        ))}
      </div>
    </div>
  )
}
