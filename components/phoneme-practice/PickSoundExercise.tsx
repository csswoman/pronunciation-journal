'use client'

// Planned structure:
// <PickSoundExercise>
//   <PhonemeExercisePrompt />
//   <PhonemeStimulusCard>
//     <PhonemePlayButton />
//   </PhonemeStimulusCard>
//   <OptionsGrid />
//   <PhonemeConfirmButton />
// </PickSoundExercise>

import { useState } from 'react'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeConfirmButton } from '@/components/phoneme-practice/PhonemeConfirmButton'
import { PhonemeExercisePrompt } from '@/components/phoneme-practice/PhonemeExercisePrompt'
import { PhonemePlayButton } from '@/components/phoneme-practice/PhonemePlayButton'
import { PhonemeStimulusCard } from '@/components/phoneme-practice/PhonemeStimulusCard'
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
        title="¿Qué sonido escuchaste?"
        kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Identificación de sonido` : 'Identificación de sonido'}
        hint="Escucha y elige el símbolo IPA correcto."
      />

      <PhonemeStimulusCard
        button={
          <PhonemePlayButton
            ariaLabel={`Escuchar ${exercise.ipa}`}
            ipa={exercise.ipa}
            size="lg"
            className="size-18 border-transparent bg-ink text-white shadow-none hover:border-transparent hover:bg-ink hover:text-white"
          />
        }
        caption="Toca para escuchar"
      />

      <div
        role="radiogroup"
        aria-label={`Sonido en “${exercise.targetWord ?? 'la palabra'}”`}
        className={cn(
          'grid w-full gap-3',
          exercise.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4',
        )}
      >
        {exercise.options.map((opt, i) => {
          const isCorrect = exercise.correctIds.includes(opt.id)
          const isSelected = selected === opt.id

          return (
            <div
              key={opt.id}
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(opt.id, opt.label)}
              className={cn(
                'relative flex min-h-20 cursor-pointer items-center justify-center rounded-2xl border-2 px-3 py-4 transition-all duration-150 select-none',
                !submitted && !isSelected && 'border-transparent bg-surface-sunken text-fg hover:border-border-strong dark:bg-white/10',
                !submitted && isSelected && 'border-primary bg-primary-soft text-primary font-semibold dark:bg-primary/25',
                submitted && isCorrect && 'border-success-border bg-success-soft text-success pf-reveal-ok font-semibold',
                submitted && isSelected && !isCorrect && 'border-error-border bg-error-soft text-error pf-reveal-bad font-semibold',
                submitted && !isSelected && !isCorrect && 'cursor-default border-transparent bg-surface-sunken text-fg-subtle opacity-40 dark:bg-white/10',
              )}
            >
              <span
                className={cn(
                  'absolute left-2 top-2 flex size-6 items-center justify-center rounded-full border text-tiny font-semibold',
                  isSelected ? 'border-current' : 'border-border-strong text-fg-subtle',
                )}
                aria-hidden
              >
                {i + 1}
              </span>
              <span className="font-ipa text-h3 font-medium">{opt.label}</span>
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
