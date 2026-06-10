'use client'

import { useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeExercisePrompt } from './PhonemeExercisePrompt'
import { getPhonemeExerciseMeta } from '@/lib/phoneme-practice/exercise-labels'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
}

export function MinimalPairExercise({ exercise, onSubmit, focusUi = false, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const meta = getPhonemeExerciseMeta('minimal_pair', { ipa: exercise.ipa })

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

  if (!focusUi) {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <p className="text-[15px] text-[var(--text-secondary)] text-center m-0">Which word contains</p>
        <span className="[font-family:var(--font-phoneme),serif] text-3xl font-bold text-[var(--primary)]">
          {exercise.ipa}
        </span>
        <p className="text-xs text-[var(--text-tertiary)] text-center tracking-[.05em] m-0">
          Tap a word to hear it and select it
        </p>
        {options}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          style={canConfirm ? { backgroundImage: 'var(--gradient-primary)' } : undefined}
          className={[
            'w-full p-4 rounded-[var(--radius-md)] border-none [font-family:inherit] text-[15px] font-semibold transition-all',
            canConfirm
              ? 'cursor-pointer text-on-primary shadow-md hover:-translate-y-[1px]'
              : 'cursor-not-allowed bg-surface-raised text-fg-subtle',
          ].join(' ')}
        >
          Check
        </button>
      </div>
    )
  }

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt
        centered
        spacious
        eyebrow={meta.eyebrow}
        title={exercise.ipa ? '¿Cuál palabra contiene este sonido?' : meta.title}
        hint="Toca una palabra para escucharla y elegirla"
      />
      {exercise.ipa && (
        <p className="pf-minimal-pair__ipa" aria-label={`Sonido objetivo ${exercise.ipa}`}>
          {exercise.ipa}
        </p>
      )}
      {options}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!canConfirm}
        className="pf-cta pf-cta--primary"
      >
        Comprobar
      </button>
    </div>
  )
}
