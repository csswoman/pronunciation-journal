'use client'

import { useState } from 'react'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeConfirmButton } from '@/components/phoneme-practice/PhonemeConfirmButton'
import { PhonemeExercisePrompt } from '@/components/phoneme-practice/PhonemeExercisePrompt'
import { PhonemePlayButton } from '@/components/phoneme-practice/PhonemePlayButton'
import { playUiCue } from '@/lib/ui-sounds/cues'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
}

export function PickSoundExercise({ exercise, onSubmit, focusUi = false }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSelect(id: string, label: string) {
    if (submitted) return
    playUiCue('tap')
    playIpaSound(label)
    setSelected(id)
  }

  function handleSubmit() {
    if (!selected || submitted) return
    setSubmitted(true)
    const isCorrect = exercise.correctIds.includes(selected)
    const label = exercise.options.find((o) => o.id === selected)?.label ?? ''
    onSubmit(isCorrect, label)
  }

  function optClass(id: string): string {
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect) return 'pf-opt pf-opt--ipa pf-opt--correct pf-opt--reveal'
      if (selected === id) return 'pf-opt pf-opt--ipa pf-opt--wrong pf-opt--reveal'
      return 'pf-opt pf-opt--ipa pf-opt--dim'
    }
    if (selected === id) return 'pf-opt pf-opt--ipa pf-opt--sel'
    return 'pf-opt pf-opt--ipa'
  }

  const canCheck = Boolean(selected) && !submitted

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt
        centered
        title={<>¿Qué sonido<br />escuchaste?</>}
      />

      <PhonemePlayButton
        ariaLabel={`Escuchar ${exercise.ipa}`}
        ipa={exercise.ipa}
        caption={exercise.ipa}
        size="lg"
      />

      <div
        role="radiogroup"
        aria-label={`Sonido en “${exercise.targetWord ?? 'la palabra'}”`}
        className="pf-options pf-options--grid w-full"
      >
        {exercise.options.map((opt, i) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected === opt.id}
            aria-label={`Seleccionar ${opt.label}`}
            aria-disabled={submitted}
            onClick={() => handleSelect(opt.id, opt.label)}
            className={optClass(opt.id)}
          >
            {focusUi && <span className="pf-opt__key">{i + 1}</span>}
            {opt.label}
          </button>
        ))}
      </div>

      {!submitted && (
        <PhonemeConfirmButton onClick={handleSubmit} disabled={!canCheck} />
      )}
    </div>
  )
}
