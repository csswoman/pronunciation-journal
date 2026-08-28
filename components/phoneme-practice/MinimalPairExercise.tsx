'use client'

// Planned structure:
// <MinimalPairExercise>
//   <PhonemeExercisePrompt />
//   <PhonemePlayButton />
//   <OptionsGrid />
//   <PhonemeConfirmButton />
//   <FeedbackNote />
// </MinimalPairExercise>

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
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
}

export function MinimalPairExercise({ exercise, onSubmit, focusUi = false, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSelect(id: string) {
    if (submitted) return
    playUiCue('tap')
    setSelected(id)
  }

  function handleConfirm() {
    if (!selected || submitted) return
    setSubmitted(true)
    const isCorrect = exercise.correctIds.includes(selected)
    const label = exercise.options.find((o) => o.id === selected)?.label ?? ''
    onSubmit(isCorrect, label)
  }

  const canConfirm = Boolean(selected) && !submitted
  const correctOption = exercise.options.find((option) =>
    exercise.correctIds.includes(option.id),
  )
  const selectedOption = exercise.options.find((option) => option.id === selected)
  const selectedIsCorrect = selected ? exercise.correctIds.includes(selected) : false
  const playWord = exercise.targetWord ?? correctOption?.label ?? ''

  const rawIpa = exercise.ipa?.replace(/^\/+|\/+$/g, '')
  const ipaDisplay = rawIpa ? `/${rawIpa}/` : undefined

  return (
    <div className="flex w-full flex-col gap-6">
      <PhonemeExercisePrompt
        centered
        title="Escucha el audio y elige la palabra"
        kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Pares mínimos` : 'Pares mínimos'}
        hint="Identifica cuál de las dos palabras fue pronunciada"
      />

      {playWord && (
        <div className="flex justify-center py-2">
          <PhonemePlayButton
            ariaLabel={`Escuchar ${playWord}`}
            word={playWord}
            voice={voice}
            size="lg"
          />
        </div>
      )}

      <div
        role="radiogroup"
        aria-label={`Palabra con ${exercise.ipa}`}
        className="grid w-full grid-cols-2 gap-3.5"
      >
        {exercise.options.map((opt) => {
          const isCorrect = exercise.correctIds.includes(opt.id)
          const isSelected = selected === opt.id

          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Seleccionar ${opt.label}`}
              disabled={submitted}
              onClick={() => handleSelect(opt.id)}
              className={cn(
                'group flex min-h-14 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 p-4 transition-all duration-150 select-none text-center focus-ring',
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
            </button>
          )
        })}
      </div>

      {!submitted && (
        <PhonemeConfirmButton onClick={handleConfirm} disabled={!canConfirm} />
      )}

      {submitted && correctOption && !focusUi && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'flex flex-col gap-1 rounded-xl border px-4 py-3.5 text-body-sm',
            selectedIsCorrect
              ? 'border-success-border bg-success-soft text-success'
              : 'border-error-border bg-error-soft text-error',
          )}
        >
          <p className="font-semibold">
            {selectedIsCorrect ? '¡Correcto!' : `La respuesta correcta es “${correctOption.label}”.`}
          </p>
          {exercise.ipa && (
            <p className="text-fg-secondary">
              <strong>{correctOption.label}</strong> contiene el sonido{' '}
              <strong className="font-mono text-primary">{exercise.ipa}</strong>.
              {selectedOption && !selectedIsCorrect
                ? ` “${selectedOption.label}” usa un sonido diferente.`
                : ''}
            </p>
          )}
        </div>
      )}

      {submitted && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border-default bg-surface-raised/60 p-3">
          <span className="text-caption font-semibold text-fg-muted uppercase tracking-wider">
            Compara ambos sonidos
          </span>
          <div className="flex items-center gap-4">
            {exercise.options.map((opt) => (
              <div key={`compare-${opt.id}`} className="flex flex-col items-center gap-1">
                <PhonemePlayButton
                  ariaLabel={`Escuchar ${opt.label}`}
                  word={opt.label}
                  voice={voice}
                  size="md"
                />
                <span className="text-body-xs font-medium text-fg">{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {submitted && correctOption && focusUi && !selectedIsCorrect && (
        <p className="m-0 text-center text-body-sm text-fg-muted" role="status">
          <strong>{correctOption.label}</strong> lleva {exercise.ipa}.
          {selectedOption ? ` “${selectedOption.label}” suena distinto.` : ''}
        </p>
      )}
    </div>
  )
}
