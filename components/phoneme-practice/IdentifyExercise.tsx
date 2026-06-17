'use client'

// Planned structure:
// <IdentifyExercise>
//   <Title />         — Fraunces heading
//   <PlayButton />    — circular audio button
//   <YesNoButtons />  — binary answer
//   <ConfirmButton /> — submit
// </IdentifyExercise>

import { useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
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

  function handlePlay() {
    if (exercise.targetWord) speak(exercise.targetWord, { voice })
  }

  function handleSelect(id: string) {
    if (submitted) return
    setSelected(id)
  }

  function handleConfirm() {
    if (!selected || submitted) return
    setSubmitted(true)
    const isCorrect = exercise.correctIds.includes(selected)
    onSubmit(isCorrect, selected)
  }

  function optClass(id: string) {
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect) return 'correct'
      if (selected === id) return 'wrong'
      return 'dim'
    }
    if (selected === id) return 'selected'
    return 'default'
  }

  const optStyles: Record<string, string> = {
    correct: 'bg-success-soft border-success-border text-success ring-2 ring-success/30',
    wrong: 'bg-error-soft border-error-border text-error ring-2 ring-error/30',
    dim: 'bg-surface-raised border-border-subtle text-(--fg-primary) opacity-40',
    selected: 'bg-surface-raised border-primary text-primary ring-2 ring-primary/20',
    default: 'bg-surface-raised border-border-default text-(--fg-primary) hover:border-primary/50 hover:-translate-y-px hover:shadow-sm',
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-(--fg-tertiary) m-0">
          Does it contain {exercise.ipa}?
        </p>
        <h2
          className="text-xl font-semibold text-(--fg-primary) text-center leading-snug m-0"
          style={{ fontFamily: 'Fraunces, Georgia, serif' }}
        >
          Listen and decide
        </h2>
      </div>

      <button
        type="button"
        onClick={handlePlay}
        aria-label={`Play word${exercise.targetWord ? `: ${exercise.targetWord}` : ''}`}
        className="w-16 h-16 rounded-full flex items-center justify-center bg-surface-raised border border-border-default shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-150 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-(--fg-primary)" aria-hidden>
          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.348 2.595.342 1.241 1.519 1.905 2.66 1.905H6.44l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
          <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>

      <p className="text-xs font-semibold uppercase tracking-widest text-(--fg-tertiary) m-0">
        Choose your answer
      </p>

      <div role="radiogroup" aria-label="Does it contain the sound?" className="grid grid-cols-2 gap-3 w-full">
        {exercise.options.map(opt => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected === opt.id}
            aria-disabled={submitted}
            onClick={() => handleSelect(opt.id)}
            className={cn(
              'py-4 px-3 rounded-xl border text-sm font-semibold transition-all duration-150 cursor-pointer',
              optStyles[optClass(opt.id)],
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!canConfirm}
        className={[
          'w-full py-4 rounded-xl font-semibold text-[15px] transition-all duration-150',
          canConfirm
            ? 'bg-(--cta-bg) text-(--cta-fg) cursor-pointer hover:-translate-y-px shadow-md'
            : 'bg-surface-raised text-(--fg-disabled) cursor-not-allowed border border-border-subtle',
        ].join(' ')}
      >
        Check
      </button>
    </div>
  )
}
