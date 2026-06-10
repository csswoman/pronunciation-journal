'use client'

// Planned structure:
// <OddOneOutExercise>
//   <PhonemeExercisePrompt />  — instrucción
//   <StimuliGrid />           — 4 botones de audio numerados
//   <OptionButtons />         — selección de la palabra diferente
//   <ConfirmButton />
// </OddOneOutExercise>

import { useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeExercisePrompt } from './PhonemeExercisePrompt'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  voice?: SpeechSynthesisVoice
}

export function OddOneOutExercise({ exercise, onSubmit, voice }: Props) {
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
    // Also play the selected word
    const idx = parseInt(id, 10)
    handlePlay(idx)
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
        title="¿Cuál es la palabra diferente?"
        hint="Tres palabras tienen el mismo sonido; una no"
      />

      <div className="flex gap-2 justify-center flex-wrap">
        {stimuli.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handlePlay(i)}
            aria-label={`Escuchar palabra ${i + 1}`}
            className="pf-stim-btn"
          >
            🔊 {i + 1}
          </button>
        ))}
      </div>

      <div role="radiogroup" aria-label="¿Cuál es la diferente?" className="pf-options pf-options--grid">
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
