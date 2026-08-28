'use client'

// Planned structure:
// <IdentifyExercise>
//   <PhonemeExercisePrompt />
//   <PhonemePlayButton />
//   <OptionsGrid />
//   <PhonemeConfirmButton />
// </IdentifyExercise>

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

  const rawIpa = exercise.ipa?.replace(/^\/+|\/+$/g, '')
  const ipaDisplay = rawIpa ? `/${rawIpa}/` : undefined

  return (
    <div className="flex w-full flex-col gap-6">
      <PhonemeExercisePrompt
        centered
        title="Escucha el audio y decide"
        kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Identificación` : 'Identificación'}
        hint={`¿La palabra pronunciada contiene el sonido ${ipaDisplay ?? exercise.ipa ?? ''}?`}
      />

      <div className="flex justify-center py-2">
        <PhonemePlayButton
          ariaLabel={
            exercise.targetWord
              ? `Escuchar ${exercise.targetWord}`
              : 'Escuchar palabra'
          }
          word={exercise.targetWord}
          voice={voice}
          size="lg"
        />
      </div>

      <div
        role="radiogroup"
        aria-label="¿Contiene el sonido?"
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
