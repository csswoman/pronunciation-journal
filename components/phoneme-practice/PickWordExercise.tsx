'use client'

// Planned structure:
// <PickWordExercise>
//   <PhonemeExercisePrompt />
//   <PhonemePlayButton />
//   <OptionsGrid />
//   <PhonemeConfirmButton />
// </PickWordExercise>

import { useState } from 'react'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { speak } from '@/lib/phoneme-practice/tts'
import { PhonemeConfirmButton } from '@/components/phoneme-practice/PhonemeConfirmButton'
import { PhonemeExercisePrompt } from '@/components/phoneme-practice/PhonemeExercisePrompt'
import { PhonemePlayButton } from '@/components/phoneme-practice/PhonemePlayButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
}

export function PickWordExercise({ exercise, onSubmit }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)

  function toggle(id: string, label: string) {
    speak(label)
    if (submitted) return
    playUiCue('tap')
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit() {
    if (submitted || selected.size === 0) return
    setSubmitted(true)
    const correctSet = new Set(exercise.correctIds)
    const isCorrect =
      selected.size === correctSet.size && [...selected].every((id) => correctSet.has(id))
    const userAnswer = exercise.options
      .filter((o) => selected.has(o.id))
      .map((o) => o.label)
      .join(', ')
    onSubmit(isCorrect, userAnswer)
  }

  const canCheck = selected.size > 0 && !submitted

  const rawIpa = exercise.ipa?.replace(/^\/+|\/+$/g, '')
  const ipaDisplay = rawIpa ? `/${rawIpa}/` : undefined

  return (
    <div className="flex w-full flex-col gap-6">
      <PhonemeExercisePrompt
        centered
        title={<>¿Qué palabras llevan el sonido <span className="font-ipa text-primary">{ipaDisplay ?? exercise.ipa}</span>?</>}
        kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Selección múltiple` : 'Selección múltiple'}
        hint="Puedes seleccionar más de una opción que contenga el fonema"
      />

      <div className="flex justify-center py-2">
        <PhonemePlayButton
          ariaLabel={`Escuchar ${exercise.ipa}`}
          ipa={exercise.ipa}
          caption={exercise.ipa}
          size="lg"
        />
      </div>

      <div
        role="group"
        aria-label="Opciones — selecciona todas las que contienen el sonido"
        className="grid w-full grid-cols-2 gap-3.5"
      >
        {exercise.options.map((opt) => {
          const isSel = selected.has(opt.id)
          const isCorrect = exercise.correctIds.includes(opt.id)

          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isSel}
              aria-label={`Seleccionar ${opt.label}`}
              disabled={submitted}
              onClick={() => toggle(opt.id, opt.label)}
              className={cn(
                'group flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-4 transition-all duration-150 select-none text-left focus-ring',
                !submitted && !isSel && 'border-border-default bg-surface-sunken/40 hover:border-primary/50 hover:bg-surface-sunken text-fg',
                !submitted && isSel && 'border-primary bg-primary-soft text-primary shadow-xs font-semibold ring-1 ring-primary/30',
                submitted && isCorrect && 'border-success-border bg-success-soft text-success pf-reveal-ok font-semibold',
                submitted && isSel && !isCorrect && 'border-error-border bg-error-soft text-error pf-reveal-bad font-semibold',
                submitted && !isSel && !isCorrect && 'border-border-subtle bg-surface-raised/40 text-fg-subtle opacity-40 cursor-default',
              )}
            >
              <span className="text-body-lg font-medium">{opt.label}</span>
              <div
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
                  !isSel && 'border-border-strong bg-surface-base',
                  isSel && !submitted && 'border-primary bg-primary text-on-primary',
                  submitted && isCorrect && 'border-success bg-success text-on-primary',
                  submitted && isSel && !isCorrect && 'border-error bg-error text-on-primary',
                )}
                aria-hidden
              >
                {isSel && (
                  <span className="text-xs font-bold leading-none">✓</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {!submitted && (
        <PhonemeConfirmButton onClick={handleSubmit} disabled={!canCheck} />
      )}
    </div>
  )
}
