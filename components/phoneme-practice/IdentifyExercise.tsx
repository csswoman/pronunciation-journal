'use client'

// Planned structure:
// <IdentifyExercise>
//   <PhonemeExercisePrompt />    — instrucción + IPA objetivo
//   <PlayButton />              — reproduce la palabra de prueba
//   <YesNoButtons />            — respuesta binaria
//   <ConfirmButton />           — envía
// </IdentifyExercise>

import { useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeExercisePrompt } from './PhonemeExercisePrompt'

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
        eyebrow={`¿Contiene el sonido ${exercise.ipa}?`}
        title="Escucha la palabra y decide"
        hint="Pulsa el botón para escuchar"
      />

      <button
        type="button"
        onClick={handlePlay}
        aria-label={`Escuchar palabra${exercise.targetWord ? `: ${exercise.targetWord}` : ''}`}
        className="pf-play-btn mx-auto"
      >
        🔊 Escuchar
      </button>

      <div role="radiogroup" aria-label="¿Contiene el sonido?" className="pf-options pf-options--grid">
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
