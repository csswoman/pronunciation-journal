'use client'

// Planned structure:
// <AxSameDifferentExercise>
//   <PhonemeExercisePrompt />
//   <StimuliCards />          — A and X audio stimulus boxes
//   <PlayBothChip />          — Listen sequence button
//   <OptionsGrid />           — "Iguales" or "Distintos" choice with radio dots
//   <PhonemeConfirmButton />  — Check answer CTA
// </AxSameDifferentExercise>

import { useState } from 'react'
import { Volume2, Play } from '@/components/icons'
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

  const rawIpa = exercise.ipa?.replace(/^\/+|\/+$/g, '')
  const ipaDisplay = rawIpa ? `/${rawIpa}/` : undefined

  return (
    <div className="flex w-full flex-col gap-6">
      <PhonemeExercisePrompt
        centered
        title="¿Suenan igual o distinto?"
        kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Discriminación AX` : 'Discriminación AX'}
        hint="Escucha los estímulos A y X, luego determina si son iguales"
      />

      <div className="grid w-full grid-cols-2 gap-3.5">
        {STIMULUS_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => handlePlay(i)}
            aria-label={`Escuchar estímulo ${label}`}
            className="flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-border-default bg-surface-sunken/50 p-4 transition-all duration-150 hover:bg-surface-sunken hover:border-primary/50 focus-ring select-none"
          >
            <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-subtle">
              Sonido {label}
            </span>
            <div className="flex size-11 items-center justify-center rounded-full border border-border-default bg-surface-raised text-fg transition-all duration-150">
              <Volume2 size={20} aria-hidden />
            </div>
            <span className="text-caption font-medium text-fg-muted">
              Reproducir
            </span>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handlePlayBoth}
          aria-label="Escuchar A y luego X en secuencia"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border-default bg-surface-raised px-4 py-2 text-body-sm font-medium text-fg transition-all duration-150 hover:border-primary hover:text-primary active:scale-95 focus-ring shadow-xs"
        >
          <Play size={13} fill="currentColor" aria-hidden />
          <span>Escuchar en secuencia (A → X)</span>
        </button>
      </div>

      <div
        role="radiogroup"
        aria-label="¿Igual o distinto?"
        className="grid w-full grid-cols-2 gap-3.5"
      >
        {exercise.options.map((opt) => {
          const isCorrect = exercise.correctIds.includes(opt.id)
          const isSelected = selected === opt.id

          return (
            <div
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={cn(
                'group flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 p-4 transition-all duration-150 select-none',
                !submitted && !isSelected && 'border-border-default bg-surface-sunken/40 hover:border-primary/50 hover:bg-surface-sunken text-fg',
                !submitted && isSelected && 'border-primary bg-primary-soft text-primary shadow-xs font-semibold ring-1 ring-primary/30',
                submitted && isCorrect && 'border-success-border bg-success-soft text-success pf-reveal-ok font-semibold',
                submitted && isSelected && !isCorrect && 'border-error-border bg-error-soft text-error pf-reveal-bad font-semibold',
                submitted && !isSelected && !isCorrect && 'border-border-subtle bg-surface-raised/40 text-fg-subtle opacity-40 cursor-default',
              )}
            >
              <div
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                  !isSelected && 'border-border-strong bg-surface-base',
                  isSelected && !submitted && 'border-primary bg-primary text-on-primary',
                  submitted && isCorrect && 'border-success bg-success text-on-primary',
                  submitted && isSelected && !isCorrect && 'border-error bg-error text-on-primary',
                )}
                aria-hidden
              >
                {isSelected && (
                  <div className="size-2 rounded-full bg-current" />
                )}
              </div>
              <span className="text-body-lg font-semibold">{opt.label}</span>
            </div>
          )
        })}
      </div>

      {!submitted && (
        <PhonemeConfirmButton onClick={handleConfirm} disabled={!canConfirm} />
      )}
    </div>
  )
}
