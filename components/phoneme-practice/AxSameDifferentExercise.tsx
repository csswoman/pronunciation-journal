'use client'

// Planned structure:
// <AxSameDifferentExercise>
//   <PhonemeExercisePrompt />  — instrucción
//   <StimuliButtons />        — botones A y X para reproducir
//   <SameDiffOptions />       — igual / diferente
//   <ConfirmButton />
// </AxSameDifferentExercise>

import { useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeExercisePrompt } from './PhonemeExercisePrompt'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  voice?: SpeechSynthesisVoice
}

const LABELS = ['A', 'X']

export function AxSameDifferentExercise({ exercise, onSubmit, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const stimuli = exercise.stimuli ?? []
  const canConfirm = Boolean(selected) && !submitted

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

  function optClass(id: string) {
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect) return 'pf-pair-opt pf-opt--correct'
      if (selected === id) return 'pf-pair-opt pf-opt--wrong'
      return 'pf-pair-opt pf-opt--dim'
    }
    if (selected === id) return 'pf-pair-opt pf-opt--sel'
    return 'pf-pair-opt'
  }

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt
        centered
        spacious
        eyebrow={`Sonido objetivo: ${exercise.ipa}`}
        title="¿Tienen el mismo sonido?"
        hint="Escucha A y X por separado"
      />

      <div className="flex gap-3 justify-center">
        {LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => handlePlay(i)}
            aria-label={`Escuchar estímulo ${label}`}
            className="pf-stim-btn"
          >
            🔊 {label}
          </button>
        ))}
      </div>

      <div role="radiogroup" aria-label="¿Igual o diferente?" className="pf-options pf-options--grid">
        {exercise.options.map(opt => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected === opt.id}
            aria-disabled={submitted}
            onClick={() => handleSelect(opt.id)}
            className={optClass(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

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
