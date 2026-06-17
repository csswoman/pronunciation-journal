'use client'

import { useState } from 'react'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import type { Exercise } from '@/lib/phoneme-practice/types'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
}

export function PickSoundExercise({ exercise, onSubmit, focusUi = false }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSelect(id: string, label: string) {
    if (submitted) return
    playIpaSound(label.replace(/[/\[\]]/g, '').trim())
    setSelected(id)
  }

  function handleSubmit() {
    if (!selected || submitted) return
    setSubmitted(true)
    const isCorrect = exercise.correctIds.includes(selected)
    const label = exercise.options.find((o) => o.id === selected)?.label ?? ''
    onSubmit(isCorrect, label)
  }

  function optClass(id: string): string {
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect) return 'pf-opt pf-opt--ipa pf-opt--correct'
      if (selected === id) return 'pf-opt pf-opt--ipa pf-opt--wrong'
      return 'pf-opt pf-opt--ipa pf-opt--dim'
    }
    if (selected === id) return 'pf-opt pf-opt--ipa pf-opt--sel'
    return 'pf-opt pf-opt--ipa'
  }

  const canCheck = Boolean(selected) && !submitted

  return (
    <div className={focusUi ? 'phoneme-focus__exercise' : 'flex flex-col items-center gap-5 w-full'}>
      <h2 className="text-(--fg-primary) text-2xl font-bold leading-tight tracking-tight m-0 text-center [font-family:var(--font-display,Fraunces,Georgia,serif)]">
        Which sound<br />did you hear?
      </h2>

      <button
        type="button"
        onClick={() => playIpaSound(exercise.ipa.replace(/[/\[\]]/g, '').trim())}
        className="self-center flex flex-col items-center justify-center gap-2 w-24 h-24 rounded-full bg-surface-raised border border-border-default shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-px active:scale-95"
        aria-label={`Play sound ${exercise.ipa}`}
      >
        <span className="text-2xl leading-none" aria-hidden>🔊</span>
        <span className="text-lg font-bold text-(--fg-primary) [font-family:var(--font-mono-var,monospace)]">
          {exercise.ipa}
        </span>
      </button>

      <div
        role="radiogroup"
        aria-label={`Sound in "${exercise.targetWord}"`}
        className="pf-options pf-options--grid w-full"
      >
        {exercise.options.map((opt, i) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected === opt.id}
            aria-label={`Select ${opt.label}`}
            aria-disabled={submitted}
            onClick={() => handleSelect(opt.id, opt.label)}
            className={optClass(opt.id)}
          >
            {focusUi && <span className="pf-opt__key">{i + 1}</span>}
            {opt.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canCheck}
        className={focusUi ? 'pf-cta pf-cta--primary' : [
          'w-full p-4 rounded-md border-none font-[inherit] text-[15px] font-semibold transition-all',
          canCheck
            ? 'cursor-pointer text-(--cta-fg) bg-(--cta-bg) hover:-translate-y-px'
            : 'cursor-not-allowed bg-surface-raised text-(--fg-disabled)',
        ].join(' ')}
      >
        Check
      </button>
    </div>
  )
}
