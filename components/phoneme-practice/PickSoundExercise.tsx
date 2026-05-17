'use client'

import { useEffect, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { playIpaSound } from '@/lib/ipa-audio'
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
      if (isCorrect) return `${BASE_OPT} bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--success)]`
      if (selected === id) return `${BASE_OPT} bg-[var(--error-soft)] border-[var(--error-border)] text-[var(--error)]`
      return `${BASE_OPT} bg-[var(--surface-raised)] border-[var(--border-subtle)] text-[var(--text-primary)] opacity-[0.45]`
    }
    return `${BASE_OPT} bg-[var(--surface-raised)] border-[var(--border-subtle)] text-[var(--text-primary)]`
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

      <div className="grid grid-cols-2 gap-3 w-full">
        {exercise.options.map(opt => (
          <button key={opt.id} type="button" onClick={() => handleSelect(opt.id, opt.label)} className={getClass(opt.id)}>
            {opt.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selected || submitted}
        className={[
          'w-full p-4 rounded-[var(--radius-md)] border-none [font-family:inherit] text-[15px] font-semibold transition-all',
          selected && !submitted
            ? 'cursor-pointer bg-[var(--gradient-primary)] text-white shadow-[0_4px_20px_color-mix(in_oklch,var(--primary)_30%,transparent)]'
            : 'cursor-not-allowed bg-[var(--surface-raised)] text-[var(--text-tertiary)]',
        ].join(' ')}
      >
        Check
      </button>
    </div>
  )
}
