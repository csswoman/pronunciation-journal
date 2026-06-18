'use client'

// Planned structure:
// <ABXExercise>
//   <Eyebrow />       — IPA label + instruction
//   <ReferenceRow />  — A card and B card side by side (play + IPA)
//   <XCard />         — centered unknown stimulus card
//   <ChoiceRow />     — "Sounds more like A" / "Sounds more like B" buttons
//   <ConfirmButton />
// </ABXExercise>

import { useState } from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/lib/cn'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'

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
    setSelected(id)
  }

  function handleConfirm() {
    if (!selected || submitted) return
    setSubmitted(true)
    onSubmit(exercise.correctIds.includes(selected), selected)
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">

      {/* Eyebrow + instruction */}
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-[11px] font-semibold tracking-[0.09em] uppercase text-fg-subtle">
          {exercise.ipa}
        </span>
        <p className="font-[Fraunces,Georgia,serif] text-xl font-bold text-fg leading-snug">
          Does <span className="text-primary">X</span> sound more like <span className="text-fg">A</span> or <span className="text-fg">B</span>?
        </p>
        <p className="text-xs text-fg-subtle mt-0.5">
          Listen to all three, then choose
        </p>
      </div>

      {/* Reference cards: A and B */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {[stimA, stimB].map((stim, i) => {
          const label = i === 0 ? 'A' : 'B'
          return stim ? (
            <div
              key={label}
              className="flex flex-col items-center gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-5"
            >
              <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-fg-subtle">
                {label}
              </span>
              <button
                type="button"
                onClick={() => handlePlay(i)}
                aria-label={`Play ${label}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border-default bg-surface-base text-fg-secondary transition-all duration-150 hover:border-primary hover:text-primary hover:shadow-sm active:scale-95 cursor-pointer"
              >
                <Play size={16} fill="currentColor" />
              </button>
              {stim.ipa && (
                <span className="font-mono text-sm text-fg-secondary">{stim.ipa}</span>
              )}
            </div>
          ) : null
        })}
      </div>

      {/* X — the unknown */}
      {stimX && (
        <div className="flex flex-col items-center gap-3 w-full rounded-xl border-2 border-primary bg-primary/5 px-4 py-5">
          <span className="text-[11px] font-semibold tracking-[0.08em] uppercase text-primary">
            X — unknown
          </span>
          <button
            type="button"
            onClick={() => handlePlay(2)}
            aria-label="Play X"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-surface-raised text-primary transition-all duration-150 hover:bg-primary hover:text-white hover:shadow-md active:scale-95 cursor-pointer"
          >
            <Play size={18} fill="currentColor" />
          </button>
          <span className="font-mono text-sm text-primary/70">?</span>
        </div>
      )}

      {/* Choice buttons */}
      <div
        role="radiogroup"
        aria-label="Choose A or B"
        className="grid grid-cols-2 gap-3 w-full"
      >
        {exercise.options.map(opt => {
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
              className={cn(
                'rounded-xl border-2 py-3 text-sm font-semibold transition-all duration-150 cursor-pointer',
                !submitted && !isSelected && 'border-border-default bg-surface-raised text-fg-secondary hover:border-primary hover:text-primary',
                !submitted && isSelected && 'border-primary bg-primary/8 text-primary',
                submitted && isCorrect && 'border-success bg-success/10 text-success',
                submitted && isSelected && !isCorrect && 'border-error bg-error/10 text-error',
                submitted && !isSelected && !isCorrect && 'border-border-subtle text-fg-disabled opacity-50',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Confirm */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!selected || submitted}
        className="w-full rounded-xl bg-(--cta-bg) py-3 text-sm font-semibold text-(--cta-fg) transition-all duration-150 hover:opacity-90 active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        Check
      </button>
    </div>
  )
}
