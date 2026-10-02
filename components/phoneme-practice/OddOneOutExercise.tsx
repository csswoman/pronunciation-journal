'use client'

// Planned structure:
// <OddOneOutExercise>
//   <PhonemeExercisePrompt />
//   <OptionList>
//     <OptionRow /> — radio dot, word label, audio speaker button
//   </OptionList>
//   <PhonemeConfirmButton />
// </OddOneOutExercise>

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (submitted) return
      const index = Number(e.key) - 1
      const opt = exercise.options[index]
      if (opt) handleSelect(opt.id, opt.label)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // handleSelect only closes over `submitted` and `voice`
     
  }, [exercise.options, submitted, voice])

  const rawIpa = exercise.ipa?.replace(/^\/+|\/+$/g, '')
  const ipaDisplay = rawIpa ? `/${rawIpa}/` : undefined

  return (
    <div className="flex w-full flex-col gap-6">
      <PhonemeExercisePrompt
        title="¿Cuál suena distinta?"
        kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Intruso acústico` : 'Intruso acústico'}
        hint="Tres palabras comparten la misma vocal y una no. Escúchalas antes de elegir."
      />

      <div
        role="radiogroup"
        aria-label="Elige la palabra distinta"
        className="flex flex-col gap-3"
      >
        {exercise.options.map((opt, i) => {
          const isSelected = selected === opt.id
          const isCorrect = exercise.correctIds.includes(opt.id)

          return (
            <div
              key={opt.id}
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleSelect(opt.id, opt.label)}
              className={cn(
                'group flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 py-3 pr-3 pl-4 transition-all duration-150 select-none',
                !submitted && !isSelected && 'border-transparent bg-surface-sunken hover:border-border-default',
                !submitted && isSelected && 'border-primary bg-surface-base',
                submitted && isCorrect && 'border-success-border bg-success-soft pf-reveal-ok',
                submitted && !isCorrect && isSelected && 'border-error-border bg-error-soft pf-reveal-bad',
                submitted && !isCorrect && !isSelected && 'border-transparent bg-surface-sunken opacity-40 cursor-default',
              )}
            >
              <div
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  !isSelected && 'border-border-strong bg-surface-base',
                  isSelected && !submitted && 'border-primary bg-primary text-on-primary',
                  submitted && isCorrect && 'border-success bg-success text-on-primary',
                  submitted && isSelected && !isCorrect && 'border-error bg-error text-on-primary',
                )}
                aria-hidden
              >
                {isSelected && <div className="size-2 rounded-full bg-current" />}
              </div>

              <span className="flex-1 text-body-lg font-bold text-fg">{opt.label}</span>

              {submitted && isSelected ? (
                isCorrect ? (
                  <Check size={20} className="shrink-0 text-success" />
                ) : (
                  <X size={20} className="shrink-0 text-error" />
                )
              ) : (
                <span className="shrink-0 text-small font-bold text-fg-subtle" aria-hidden>
                  {i + 1}
                </span>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlay(opt.label)
                }}
                aria-label={`Escuchar ${opt.label}`}
                className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-lilac text-ink transition-transform duration-150 active:scale-95 focus-ring"
              >
                <Volume2 size={20} aria-hidden />
              </button>
            </div>
          )
        })}
      </div>

      {!submitted && (
        <div className="flex items-center justify-end gap-4">
          <span className="hidden text-small text-fg-subtle sm:inline">
            1–{exercise.options.length} para elegir
          </span>
          <PhonemeConfirmButton
            fullWidth={false}
            onClick={handleConfirm}
            disabled={!selected || submitted}
          />
        </div>
      )}
    </div>
  )
}
