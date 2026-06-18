'use client'

// Planned structure:
// <OddOneOutExercise>
//   <Header />       — Fraunces title + subtitle
//   <OptionList />   — vertical word buttons with feedback states
//   <ConfirmButton />
// </OddOneOutExercise>

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  voice?: SpeechSynthesisVoice
}

export function OddOneOutExercise({ exercise, onSubmit, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSelect(id: string, label: string) {
    if (submitted) return
    if (label) speak(label, { voice })
    setSelected(id)
  }

  function handleConfirm() {
    if (!selected || submitted) return
    setSubmitted(true)
    onSubmit(exercise.correctIds.includes(selected), selected)
  }

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="font-[Fraunces,Georgia,serif] text-2xl font-bold leading-tight text-fg">
          Which one is different?
        </h2>
        <p className="text-sm text-fg-subtle">
          Three words share the same sound — one doesn't.
        </p>
      </div>

      {/* Word list */}
      <div role="radiogroup" aria-label="Select the odd one out" className="flex flex-col gap-2">
        {exercise.options.map(opt => {
          const isSelected = selected === opt.id
          const isCorrect = exercise.correctIds.includes(opt.id)

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={submitted}
              onClick={() => handleSelect(opt.id, opt.label)}
              className={cn(
                'flex items-center justify-between w-full px-4 py-3.5 rounded-xl border text-sm font-medium text-left transition-all duration-150',
                !submitted && !isSelected && 'border-border-default bg-surface-raised text-fg hover:border-primary/50 cursor-pointer',
                !submitted && isSelected && 'border-primary bg-primary-soft text-primary cursor-pointer',
                submitted && isCorrect && isSelected && 'border-success bg-success/10 text-success',
                submitted && isCorrect && !isSelected && 'border-success bg-success/10 text-success',
                submitted && !isCorrect && isSelected && 'border-error bg-error/10 text-error',
                submitted && !isCorrect && !isSelected && 'border-border-subtle bg-surface-raised text-fg-disabled opacity-50',
              )}
            >
              <span>{opt.label}</span>
              {submitted && isSelected && (
                isCorrect
                  ? <Check size={16} className="shrink-0" />
                  : <X size={16} className="shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      {/* Confirm */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selected || submitted}
        className="w-full rounded-xl bg-(--cta-bg) py-3 text-sm font-semibold text-(--cta-fg) transition-all duration-150 hover:opacity-90 active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        Check
      </button>
    </div>
  )
}
