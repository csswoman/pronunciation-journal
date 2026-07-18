'use client'

// Planned structure:
// <AxSameDifferentExercise>
//   <PhonemeExercisePrompt />
//   <StimuliCards />
//   <PlayBothChip />
//   <Options />
//   <PhonemeConfirmButton />
// </AxSameDifferentExercise>

import { useState } from 'react'
import { Play } from '@/components/icons'
import { speak, speakSequence } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeConfirmButton } from '@/components/phoneme-practice/PhonemeConfirmButton'
import { PhonemeExercisePrompt } from '@/components/phoneme-practice/PhonemeExercisePrompt'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  voice?: SpeechSynthesisVoice
}

const STIMULUS_LABELS = ['A', 'X'] as const

export function AxSameDifferentExercise({ exercise, onSubmit, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const stimuli = exercise.stimuli ?? []
  const canConfirm = Boolean(selected) && !submitted

  function handlePlay(index: number) {
    const word = stimuli[index]?.word
    if (word) speak(word, { voice })
  }

  function handlePlayBoth() {
    speakSequence(
      stimuli.map((s) => s.word),
      { voice },
    )
  }

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

  function optStyle(id: string) {
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect) return 'bg-success-soft border-success-border text-success ring-2 ring-success/30'
      if (selected === id) return 'bg-error-soft border-error-border text-error ring-2 ring-error/30'
      return 'bg-surface-raised border-border-subtle text-(--fg-primary) opacity-40'
    }
    if (selected === id) return 'bg-surface-raised border-primary text-primary ring-2 ring-primary/20'
    return 'bg-surface-raised border-border-default text-(--fg-primary) hover:border-primary/50 hover:-translate-y-px hover:shadow-sm'
  }

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt
        centered
        title="¿Suena igual o distinto?"
        hint="Escucha A y X, luego elige"
      />

      <div className="flex w-full gap-3">
        {STIMULUS_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => handlePlay(i)}
            aria-label={`Escuchar ${label}`}
            className="flex flex-1 cursor-pointer flex-col items-center gap-2 rounded-xl border border-border-default bg-surface-raised py-5 transition-all duration-150 hover:-translate-y-px hover:border-primary/50 hover:shadow-sm"
          >
            <span className="text-lg font-bold text-primary">{label}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary-soft">
              <Play size={16} className="fill-current text-primary" aria-hidden />
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handlePlayBoth}
        aria-label="Escuchar A y luego X"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border-default bg-surface-raised px-4 py-2 text-xs text-(--fg-secondary) transition-all duration-150 hover:border-primary/50"
      >
        <Play size={12} aria-hidden />
        Escuchar ambos
      </button>

      <div
        role="radiogroup"
        aria-label="¿Igual o distinto?"
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
              'cursor-pointer rounded-xl border px-3 py-4 text-sm font-semibold transition-all duration-150',
              optStyle(opt.id),
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
