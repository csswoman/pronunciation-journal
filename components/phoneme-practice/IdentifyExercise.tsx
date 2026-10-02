'use client'

// Planned structure:
// <IdentifyExercise>
//   <PhonemeExercisePrompt />
//   <PhonemeStimulusCard>
//     <PhonemePlayButton />
//   </PhonemeStimulusCard>
//   <OptionsGrid />
//   <PhonemeConfirmButton />
// </IdentifyExercise>

import { useState } from 'react'
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
        title="Escucha y decide"
        kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Identificación` : 'Identificación'}
        hint={
          <>
            ¿La palabra que suena tiene el sonido{' '}
            <span className="font-ipa text-ink">{ipaDisplay ?? exercise.ipa ?? ''}</span>?
          </>
        }
      />

      <PhonemeStimulusCard
        button={
          <PhonemePlayButton
            ariaLabel={
              exercise.targetWord
                ? `Escuchar ${exercise.targetWord}`
                : 'Escuchar palabra'
            }
            word={exercise.targetWord}
            voice={voice}
            size="lg"
            className="size-18 border-transparent bg-ink text-white shadow-none hover:border-transparent hover:bg-ink hover:text-white"
          />
        }
        caption="Toca para escuchar"
      />

      <div
        role="radiogroup"
        aria-label="¿Contiene el sonido?"
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
              disabled={submitted}
              onClick={() => handleSelect(opt.id)}
              className={cn(
                'group flex min-h-28 cursor-pointer items-center justify-center gap-3 rounded-3xl border-2 p-4 transition-all duration-150 select-none focus-ring',
                !submitted && !isSelected && 'border-transparent bg-surface-sunken text-fg hover:border-border-strong dark:bg-white/10',
                !submitted && isSelected && 'border-primary bg-primary-soft text-primary font-semibold dark:bg-primary/25',
                submitted && isCorrect && 'border-success-border bg-success-soft text-success pf-reveal-ok font-semibold',
                submitted && isSelected && !isCorrect && 'border-error-border bg-error-soft text-error pf-reveal-bad font-semibold',
                submitted && !isSelected && !isCorrect && 'cursor-default border-transparent bg-surface-sunken text-fg-subtle opacity-40 dark:bg-white/10',
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-tiny font-semibold',
                  isSelected ? 'border-current' : 'border-border-strong text-fg-subtle dark:border-white/50 dark:text-fg',
                )}
                aria-hidden
              >
                {opt.label.charAt(0).toUpperCase()}
              </span>
              <span className="text-h3 font-bold">{opt.label}</span>
            </button>
          )
        })}
      </div>

      {!submitted && (
        <PhonemeConfirmButton onClick={handleConfirm} disabled={!canConfirm} />
      )}
    </div>
  )
}
