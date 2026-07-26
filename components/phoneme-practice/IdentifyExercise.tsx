'use client'

import { useState } from 'react'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeConfirmButton } from '@/components/phoneme-practice/PhonemeConfirmButton'
import { PhonemeExercisePrompt } from '@/components/phoneme-practice/PhonemeExercisePrompt'
import { PhonemePlayButton } from '@/components/phoneme-practice/PhonemePlayButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  voice?: SpeechSynthesisVoice
}

export function IdentifyExercise({ exercise, onSubmit, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const canConfirm = Boolean(selected) && !submitted

  function handleSelect(id: string) {
    if (submitted) return
    playUiCue('tap')
    setSelected(id)
  }

  function handleConfirm() {
    if (!selected || submitted) return
    setSubmitted(true)
    onSubmit(exercise.correctIds.includes(selected), selected)
  }

  function optClass(id: string) {
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect) return 'correct'
      if (selected === id) return 'wrong'
      return 'dim'
    }
    if (selected === id) return 'selected'
    return 'default'
  }

  const optStyles: Record<string, string> = {
    correct: 'bg-success-soft border-success-border text-success ring-2 ring-success/30',
    wrong: 'bg-error-soft border-error-border text-error ring-2 ring-error/30',
    dim: 'bg-surface-raised border-border-subtle text-(--fg-primary) opacity-40',
    selected: 'bg-surface-raised border-primary text-primary ring-2 ring-primary/20',
    default:
      'bg-surface-raised border-border-default text-(--fg-primary) hover:border-primary/50 hover:-translate-y-px hover:shadow-sm',
  }

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt
        centered
        title="Escucha y decide"
        kicker={exercise.ipa ? `¿Lleva el sonido ${exercise.ipa}?` : undefined}
      />

      <PhonemePlayButton
        ariaLabel={
          exercise.targetWord
            ? `Escuchar ${exercise.targetWord}`
            : 'Escuchar palabra'
        }
        word={exercise.targetWord}
        voice={voice}
      />

      <div
        role="radiogroup"
        aria-label="¿Contiene el sonido?"
        className="grid w-full grid-cols-2 gap-3"
      >
        {exercise.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected === opt.id}
            aria-disabled={submitted}
            onClick={() => handleSelect(opt.id)}
            className={cn(
              'cursor-pointer rounded-xl border px-3 py-4 text-body-sm font-semibold transition-all duration-150',
              optStyles[optClass(opt.id)],
              submitted &&
                exercise.correctIds.includes(opt.id) &&
                'pf-reveal-ok',
              submitted &&
                selected === opt.id &&
                !exercise.correctIds.includes(opt.id) &&
                'pf-reveal-bad',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {!submitted && (
        <PhonemeConfirmButton onClick={handleConfirm} disabled={!canConfirm} />
      )}
    </div>
  )
}
