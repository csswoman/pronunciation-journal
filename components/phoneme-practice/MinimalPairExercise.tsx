'use client'

import { useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
}

export function MinimalPairExercise({ exercise, onSubmit, focusUi = false, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [playing, setPlaying] = useState(false)
  function handleSelect(id: string, label: string) {
    if (submitted) return
    speak(label, { voice })
    setSelected(id)
  }

  function handleConfirm() {
    if (!selected || submitted) return
    setSubmitted(true)
    const isCorrect = exercise.correctIds.includes(selected)
    const label = exercise.options.find((o) => o.id === selected)?.label ?? ''
    onSubmit(isCorrect, label)
  }

  function pairClass(id: string): string {
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect) return 'pf-pair-opt pf-opt--correct'
      if (selected === id) return 'pf-pair-opt pf-opt--wrong'
      return 'pf-pair-opt pf-opt--dim'
    }
    if (selected === id) return 'pf-pair-opt pf-opt--sel'
    return 'pf-pair-opt'
  }

  function legacyClass(id: string): string {
    const BASE =
      'rounded-[var(--radius-xl)] py-5 px-3 text-xl font-bold cursor-pointer transition-all w-full [font-family:inherit] text-center border-[1.5px] hover:-translate-y-[1px] hover:shadow-md'
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect)
        return `${BASE} bg-success-soft border-success-border text-success ring-2 ring-success/40 hover:translate-y-0 hover:shadow-none`
      if (selected === id)
        return `${BASE} bg-error-soft border-error-border text-error ring-2 ring-error/40 hover:translate-y-0 hover:shadow-none`
      return `${BASE} bg-surface-raised border-border-subtle text-fg opacity-40 hover:translate-y-0 hover:shadow-none`
    }
    if (selected === id)
      return `${BASE} bg-surface-raised border-primary text-primary ring-2 ring-primary/20`
    return `${BASE} bg-surface-raised border-border-subtle text-fg`
  }

  const canConfirm = Boolean(selected) && !submitted

  const options = (
    <div
      role="radiogroup"
      aria-label={`Palabra con ${exercise.ipa}`}
      className="pf-options pf-options--grid"
    >
      {exercise.options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={selected === opt.id}
          aria-label={`Seleccionar ${opt.label}`}
          aria-disabled={submitted}
          onClick={() => handleSelect(opt.id, opt.label)}
          className={focusUi ? pairClass(opt.id) : legacyClass(opt.id)}
        >
          <div>{opt.label}</div>
          {!focusUi && (
            <div aria-hidden className="text-[11px] font-normal mt-1 opacity-50">
              🔊 tap
            </div>
          )}
          {focusUi && <span className="pf-pair-opt__sub">Toca para escuchar</span>}
        </button>
      ))}
    </div>
  )

  const confirmButton = (
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
  )

  if (!focusUi) {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <p className="text-[15px] text-(--fg-secondary) text-center m-0">Which word contains</p>
        <span className="text-3xl font-bold text-primary" style={{ fontFamily: 'var(--font-phoneme), serif' }}>
          {exercise.ipa}
        </span>
        <p className="text-xs text-(--fg-tertiary) text-center tracking-wider m-0">
          Tap a word to hear it and select it
        </p>
        {options}
        {confirmButton}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <h2 className="text-xl font-semibold text-(--fg-primary) text-center leading-snug m-0" style={{ fontFamily: 'Fraunces, Georgia, serif' }}>
        Listen and choose the word
      </h2>

      {exercise.ipa && (
        <button
          type="button"
          aria-label="Play sound"
          onClick={() => {
            if (playing) return
            setPlaying(true)
            speak(exercise.ipa!.replace(/[/[\]]/g, ''), { voice })
            setTimeout(() => setPlaying(false), 900)
          }}
          className={[
            'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150',
            'bg-surface-raised border border-border-default shadow-sm',
            playing
              ? 'scale-95 opacity-70'
              : 'hover:shadow-md hover:-translate-y-px cursor-pointer',
          ].join(' ')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-7 h-7 text-(--fg-primary)"
            aria-hidden
          >
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.348 2.595.342 1.241 1.519 1.905 2.66 1.905H6.44l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
            <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
      )}

      {options}

      {confirmButton}
    </div>
  )
}
