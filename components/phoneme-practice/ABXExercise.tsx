'use client'

// Planned structure:
// <ABXExercise>
//   <PhonemeExercisePrompt />
//   <ReferenceRow /> — A / B
//   <XCard />
//   <ChoiceRow />
//   <PhonemeConfirmButton />
// </ABXExercise>

import { useState } from 'react'
import { Play } from '@/components/icons'
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

export function ABXExercise({ exercise, onSubmit, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const stimuli = exercise.stimuli ?? []
  const [stimA, stimB, stimX] = stimuli

  function handlePlay(index: number) {
    const word = stimuli[index]?.word
    if (word) speak(word, { voice })
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

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt
        centered
        title={
          <>
            ¿El tercero suena más como el primero o el segundo?
          </>
        }
        kicker={exercise.ipa ? `Sonido ${exercise.ipa}` : undefined}
        hint="Escucha los tres y elige"
      />

      <div className="grid w-full grid-cols-2 gap-3">
        {[stimA, stimB].map((stim, i) => {
          const label = i === 0 ? '1' : '2'
          return stim ? (
            <div
              key={label}
              className="flex flex-col items-center gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-5"
            >
              <span className="text-body-sm font-semibold text-fg-subtle">{label}</span>
              <button
                type="button"
                onClick={() => handlePlay(i)}
                aria-label={`Escuchar ${label}`}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border-default bg-surface-base text-fg-secondary transition-all duration-150 hover:border-primary hover:text-primary hover:shadow-sm active:scale-95"
              >
                <Play size={16} fill="currentColor" />
              </button>
              {stim.ipa && (
                <span className="font-mono text-body-sm text-fg-secondary">{stim.ipa}</span>
              )}
            </div>
          ) : null
        })}
      </div>

      {stimX && (
        <div className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-primary bg-primary/5 px-4 py-5">
          <span className="text-body-sm font-semibold text-primary">3 — ¿cuál es?</span>
          <button
            type="button"
            onClick={() => handlePlay(2)}
            aria-label="Escuchar el tercero"
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-primary bg-surface-raised text-primary transition-all duration-150 hover:bg-primary hover:text-white hover:shadow-md active:scale-95"
          >
            <Play size={18} fill="currentColor" />
          </button>
          <span className="font-mono text-body-sm text-primary/70">?</span>
        </div>
      )}

      <div
        role="radiogroup"
        aria-label="Elige 1 o 2"
        className="grid w-full grid-cols-2 gap-3"
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
              aria-disabled={submitted}
              onClick={() => handleSelect(opt.id)}
              className={cn( 'cursor-pointer rounded-xl border-2 py-3 text-body-sm font-semibold transition-all duration-150', !submitted && !isSelected && 'border-border-default bg-surface-raised text-fg-secondary hover:border-primary hover:text-primary', !submitted && isSelected && 'border-primary bg-primary/8 text-primary', submitted && isCorrect && 'border-success bg-success/10 text-success pf-reveal-ok', submitted && isSelected && !isCorrect && 'border-error bg-error/10 text-error pf-reveal-bad', submitted && !isSelected && !isCorrect && 'border-border-subtle text-fg-disabled opacity-50', )}
            >
              {opt.label}
            </button>
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
