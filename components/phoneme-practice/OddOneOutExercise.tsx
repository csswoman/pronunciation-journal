'use client'

// Planned structure:
// <OddOneOutExercise>
//   <PhonemeExercisePrompt />
//   <OptionList />
//   <PhonemeConfirmButton />
// </OddOneOutExercise>

import { useState } from 'react'
import { X, Check } from '@/components/icons'
import { cn } from '@/lib/cn'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeConfirmButton } from '@/components/phoneme-practice/PhonemeConfirmButton'
import { PhonemeExercisePrompt } from '@/components/phoneme-practice/PhonemeExercisePrompt'
import { playUiCue } from '@/lib/ui-sounds/cues'

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
    playUiCue('tap')
    if (label) speak(label, { voice })
    setSelected(id)
  }

  function handleConfirm() {
    if (!selected || submitted) return
    setSubmitted(true)
    onSubmit(exercise.correctIds.includes(selected), selected)
  }

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt
        title="¿Cuál es la distinta?"
        hint="Tres comparten el mismo sonido — una no"
      />

      <div
        role="radiogroup"
        aria-label="Elige la palabra distinta"
        className="flex flex-col gap-2"
      >
        {exercise.options.map((opt) => {
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
                'flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-150',
                !submitted &&
                  !isSelected &&
                  'cursor-pointer border-border-default bg-surface-raised text-fg hover:border-primary/50',
                !submitted &&
                  isSelected &&
                  'cursor-pointer border-primary bg-primary-soft text-primary',
                submitted && isCorrect && 'border-success bg-success/10 text-success pf-reveal-ok',
                submitted &&
                  !isCorrect &&
                  isSelected &&
                  'border-error bg-error/10 text-error pf-reveal-bad',
                submitted &&
                  !isCorrect &&
                  !isSelected &&
                  'border-border-subtle bg-surface-raised text-fg-disabled opacity-50',
              )}
            >
              <span>{opt.label}</span>
              {submitted && isSelected && (
                isCorrect ? (
                  <Check size={16} className="shrink-0" />
                ) : (
                  <X size={16} className="shrink-0" />
                )
              )}
            </button>
          )
        })}
      </div>

      {!submitted && (
        <PhonemeConfirmButton
          onClick={handleConfirm}
          disabled={!selected || submitted}
        />
      )}
    </div>
  )
}
