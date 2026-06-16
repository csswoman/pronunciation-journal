'use client'

// Planned structure:
// <ABXExercise>
//   <PhonemeExercisePrompt />  — instrucción + contexto de contraste
//   <ABStimuli />             — botones A y B (referencia)
//   <XStimulus />             — botón X (test)
//   <ABOptions />             — ¿X suena como A o como B?
//   <ConfirmButton />
// </ABXExercise>

import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeExercisePrompt } from './PhonemeExercisePrompt'

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
        eyebrow={`Distingue ${exercise.ipa}`}
        title="¿X suena más como A o como B?"
        hint="Escucha los tres y decide"
      />

      <div className="flex gap-3 justify-center">
        {stimA && (
          <button type="button" onClick={() => handlePlay(0)} aria-label="Escuchar A" className="pf-stim-btn">
            🔊 A
          </button>
        )}
        {stimB && (
          <button type="button" onClick={() => handlePlay(1)} aria-label="Escuchar B" className="pf-stim-btn">
            🔊 B
          </button>
        )}
      </div>

      {stimX && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => handlePlay(2)}
            aria-label="Escuchar X"
            className="pf-stim-btn pf-stim-btn--x"
          >
            🔊 X (test)
          </button>
        </div>
      )}

      <div role="radiogroup" aria-label="¿A o B?" className="pf-options pf-options--grid">
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
