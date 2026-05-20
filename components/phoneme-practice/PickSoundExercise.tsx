'use client'

import { useEffect, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import type { Exercise } from '@/lib/phoneme-practice/types'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

const BASE_OPT = 'rounded-[var(--radius-full)] py-4 px-3 text-body-lg font-bold [font-family:var(--font-ipa),monospace] cursor-pointer transition-all w-full border-[1.5px]'

export function PickSoundExercise({ exercise, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (exercise.targetWord) {
      const timer = setTimeout(() => speak(exercise.targetWord!), 300)
      return () => clearTimeout(timer)
    }
  }, [exercise.targetWord])

  function handleSelect(id: string, label: string) {
    if (submitted) return
    playIpaSound(label.replace(/[/\[\]]/g, '').trim())
    setSelected(id)
  }

  function handleSubmit() {
    if (!selected || submitted) return
    setSubmitted(true)
    const isCorrect = exercise.correctIds.includes(selected)
    const label = exercise.options.find(o => o.id === selected)?.label ?? ''
    onSubmit(isCorrect, label)
  }

  function getClass(id: string): string {
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect)
        return `${BASE_OPT} bg-success-soft border-success-border text-success ring-2 ring-success/40`
      if (selected === id)
        return `${BASE_OPT} bg-error-soft border-error-border text-error ring-2 ring-error/40`
      return `${BASE_OPT} bg-surface-raised border-border-subtle text-fg opacity-40`
    }
    if (selected === id)
      return `${BASE_OPT} bg-primary-soft border-primary text-primary shadow-md`
    return `${BASE_OPT} bg-surface-raised border-border-subtle text-fg hover:border-primary`
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <p className="text-[15px] text-[var(--text-secondary)] text-center m-0">
        Which sound does this word contain?
      </p>

      <button
        type="button"
        onClick={() => exercise.targetWord && speak(exercise.targetWord)}
        className="inline-flex items-center gap-2 bg-[var(--surface-raised)] border-[1.5px] border-[var(--border-subtle)] rounded-[var(--radius-full)] py-3 px-6 text-lg font-semibold text-[var(--text-primary)] cursor-pointer [font-family:inherit]"
      >
        🔊 {exercise.targetWord}
      </button>

      <div role="radiogroup" aria-label={`Which sound does "${exercise.targetWord}" contain?`} className="grid grid-cols-2 gap-3 w-full">
        {exercise.options.map(opt => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected === opt.id}
            aria-label={`Select ${opt.label}`}
            aria-disabled={submitted}
            onClick={() => handleSelect(opt.id, opt.label)}
            className={getClass(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selected || submitted}
        aria-disabled={!selected || submitted}
        style={selected && !submitted ? { backgroundImage: 'var(--gradient-primary)' } : undefined}
        className={[
          'w-full p-4 rounded-[var(--radius-md)] border-none [font-family:inherit] text-[15px] font-semibold transition-all',
          selected && !submitted
            ? 'cursor-pointer text-on-primary shadow-md hover:-translate-y-[1px]'
            : 'cursor-not-allowed bg-surface-raised text-fg-subtle',
        ].join(' ')}
      >
        Check
      </button>
    </div>
  )
}
