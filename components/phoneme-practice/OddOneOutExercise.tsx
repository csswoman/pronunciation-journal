'use client'

// Planned structure:
// <OddOneOutExercise>
//   <PhonemeExercisePrompt />
//   <OptionList>
//     <OptionRow /> — radio dot, word label, audio speaker button
//   </OptionList>
//   <PhonemeConfirmButton />
// </OddOneOutExercise>

import { useState } from 'react'
import { X, Check, Volume2 } from '@/components/icons'
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

  function handlePlay(label: string) {
    if (label) speak(label, { voice })
  }

  function handleSelect(id: string, label: string) {
    if (submitted) return
    playUiCue('tap')
    handlePlay(label)
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
        title="¿Cuál es la palabra distinta?"
        kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Intruso acústico` : 'Intruso acústico'}
        hint="Tres palabras comparten el mismo fonema y una suena diferente"
      />

      <div
        role="radiogroup"
        aria-label="Elige la palabra distinta"
        className="flex flex-col gap-3"
      >
        {exercise.options.map((opt) => {
          const isSelected = selected === opt.id
          const isCorrect = exercise.correctIds.includes(opt.id)

          return (
            <div
              key={opt.id}
              onClick={() => handleSelect(opt.id, opt.label)}
              className={cn(
                'group flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-150 select-none',
                !submitted && !isSelected && 'border-border-default bg-surface-sunken/40 hover:border-primary/50 hover:bg-surface-sunken',
                !submitted && isSelected && 'border-primary bg-primary-soft text-primary shadow-xs font-semibold ring-1 ring-primary/30',
                submitted && isCorrect && 'border-success-border bg-success-soft text-success pf-reveal-ok font-semibold',
                submitted && !isCorrect && isSelected && 'border-error-border bg-error-soft text-error pf-reveal-bad font-semibold',
                submitted && !isCorrect && !isSelected && 'border-border-subtle bg-surface-raised/40 text-fg-subtle opacity-40 cursor-default',
              )}
            >
              <div className="flex items-center gap-3.5">
                {/* Radio selection circle */}
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

                <span className="text-body-lg font-medium text-fg group-hover:text-fg">
                  {opt.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlay(opt.label)
                  }}
                  aria-label={`Escuchar ${opt.label}`}
                  className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-fg-subtle transition-all duration-150 hover:bg-surface-raised hover:text-fg active:scale-95 focus-ring"
                >
                  <Volume2 size={18} aria-hidden />
                </button>

                {submitted && isSelected && (
                  <div className="ml-1 shrink-0">
                    {isCorrect ? (
                      <Check size={20} className="text-success" />
                    ) : (
                      <X size={20} className="text-error" />
                    )}
                  </div>
                )}
              </div>
            </div>
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
