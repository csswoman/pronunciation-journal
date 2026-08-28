'use client'

// Planned structure:
// <PickSoundExercise>
//   <PhonemeExercisePrompt />
//   <PhonemePlayButton />
//   <OptionsGrid />
//   <PhonemeConfirmButton />
// </PickSoundExercise>

import { useState } from 'react'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
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
}

export function PickSoundExercise({ exercise, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSelect(id: string, label: string) {
    if (submitted) return
    playUiCue('tap')
    playIpaSound(label)
    setSelected(id)
  }

  function handleSubmit() {
    if (!selected || submitted) return
    setSubmitted(true)
    const isCorrect = exercise.correctIds.includes(selected)
    const label = exercise.options.find((o) => o.id === selected)?.label ?? ''
    onSubmit(isCorrect, label)
  }

  const canCheck = Boolean(selected) && !submitted

  const rawIpa = exercise.ipa?.replace(/^\/+|\/+$/g, '')
  const ipaDisplay = rawIpa ? `/${rawIpa}/` : undefined

  return (
    <div className="flex w-full flex-col gap-6">
      <PhonemeExercisePrompt
        centered
        title="¿Qué sonido fonético escuchaste?"
        kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Identificación de sonido` : 'Identificación de sonido'}
        hint="Escucha la pronunciación y selecciona el símbolo IPA correcto"
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
        role="radiogroup"
        aria-label={`Sonido en “${exercise.targetWord ?? 'la palabra'}”`}
        className="grid w-full grid-cols-2 gap-3.5"
      >
        {exercise.options.map((opt, i) => {
          const isCorrect = exercise.correctIds.includes(opt.id)
          const isSelected = selected === opt.id

          return (
            <div
              key={opt.id}
              onClick={() => handleSelect(opt.id, opt.label)}
              className={cn(
                'group flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-4 transition-all duration-150 select-none',
                !submitted && !isSelected && 'border-border-default bg-surface-sunken/40 hover:border-primary/50 hover:bg-surface-sunken text-fg',
                !submitted && isSelected && 'border-primary bg-primary-soft text-primary shadow-xs font-semibold ring-1 ring-primary/30',
                submitted && isCorrect && 'border-success-border bg-success-soft text-success pf-reveal-ok font-semibold',
                submitted && isSelected && !isCorrect && 'border-error-border bg-error-soft text-error pf-reveal-bad font-semibold',
                submitted && !isSelected && !isCorrect && 'border-border-subtle bg-surface-raised/40 text-fg-subtle opacity-40 cursor-default',
              )}
            >
              <span className="font-mono text-tiny font-semibold text-fg-subtle">
                {i + 1}
              </span>
              <span className="font-ipa text-body-lg font-bold text-center flex-1">{opt.label}</span>
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
            </div>
          )
        })}
      </div>

      {!submitted && (
        <PhonemeConfirmButton onClick={handleSubmit} disabled={!canCheck} />
      )}
    </div>
  )
}
