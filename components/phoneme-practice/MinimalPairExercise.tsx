'use client'

import { useState } from 'react'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeConfirmButton } from '@/components/phoneme-practice/PhonemeConfirmButton'
import { PhonemeExercisePrompt } from '@/components/phoneme-practice/PhonemeExercisePrompt'
import { PhonemePlayButton } from '@/components/phoneme-practice/PhonemePlayButton'
import { playUiCue } from '@/lib/ui-sounds/cues'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
}

export function MinimalPairExercise({ exercise, onSubmit, focusUi = false, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSelect(id: string) {
    if (submitted) return
    playUiCue('tap')
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
      if (isCorrect) return 'pf-pair-opt pf-opt--correct pf-opt--reveal'
      if (selected === id) return 'pf-pair-opt pf-opt--wrong pf-opt--reveal'
      return 'pf-pair-opt pf-opt--dim'
    }
    if (selected === id) return 'pf-pair-opt pf-opt--sel'
    return 'pf-pair-opt'
  }

  const canConfirm = Boolean(selected) && !submitted
  const correctOption = exercise.options.find((option) =>
    exercise.correctIds.includes(option.id),
  )
  const selectedOption = exercise.options.find((option) => option.id === selected)
  const selectedIsCorrect = selected ? exercise.correctIds.includes(selected) : false
  const playWord = exercise.targetWord ?? correctOption?.label ?? ''

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt
        centered
        title="Escucha y elige la palabra"
        kicker={exercise.ipa ? `Sonido ${exercise.ipa}` : undefined}
      />

      {playWord && (
        <PhonemePlayButton
          ariaLabel={`Escuchar ${playWord}`}
          word={playWord}
          voice={voice}
        />
      )}

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
            onClick={() => handleSelect(opt.id)}
            className={pairClass(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {!submitted && (
        <PhonemeConfirmButton onClick={handleConfirm} disabled={!canConfirm} />
      )}

      {submitted && correctOption && !focusUi && (
        <div
          role="status"
          aria-live="polite"
          className={[
            'w-full rounded-xl border px-4 py-3 text-body-sm',
            selectedIsCorrect
              ? 'border-success/30 bg-success-soft text-success'
              : 'border-error/30 bg-error-soft text-error',
          ].join(' ')}
        >
          <p className="m-0 font-semibold">
            {selectedIsCorrect ? '¡Correcto!' : `La respuesta es “${correctOption.label}”.`}
          </p>
          {exercise.ipa && (
            <p className="mt-1 mb-0 text-(--fg-primary)">
              <strong>{correctOption.label}</strong> contiene el sonido{' '}
              <strong>{exercise.ipa}</strong>.
              {selectedOption && !selectedIsCorrect
                ? ` “${selectedOption.label}” usa un sonido diferente.`
                : ''}
            </p>
          )}
        </div>
      )}

      {submitted && correctOption && focusUi && !selectedIsCorrect && (
        <p className="m-0 max-w-[40ch] text-center text-body-sm text-fg-secondary" role="status">
          <strong>{correctOption.label}</strong> lleva {exercise.ipa}.
          {selectedOption ? ` “${selectedOption.label}” suena distinto.` : ''}
        </p>
      )}
    </div>
  )
}
