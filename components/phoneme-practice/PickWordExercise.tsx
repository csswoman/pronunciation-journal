'use client'

import { useState } from 'react'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { speak } from '@/lib/phoneme-practice/tts'
import { PhonemeConfirmButton } from '@/components/phoneme-practice/PhonemeConfirmButton'
import { PhonemeExercisePrompt } from '@/components/phoneme-practice/PhonemeExercisePrompt'
import { PhonemePlayButton } from '@/components/phoneme-practice/PhonemePlayButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { cn } from '@/lib/cn'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
}

export function PickWordExercise({ exercise, onSubmit, focusUi = false }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)

  function toggle(id: string, label: string) {
    speak(label)
    if (submitted) return
    playUiCue('tap')
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit() {
    if (submitted || selected.size === 0) return
    setSubmitted(true)
    const correctSet = new Set(exercise.correctIds)
    const isCorrect =
      selected.size === correctSet.size && [...selected].every((id) => correctSet.has(id))
    const userAnswer = exercise.options
      .filter((o) => selected.has(o.id))
      .map((o) => o.label)
      .join(', ')
    onSubmit(isCorrect, userAnswer)
  }

  function optClass(id: string): string {
    const isSel = selected.has(id)
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect) return 'pf-opt pf-opt--correct pf-opt--reveal'
      if (isSel) return 'pf-opt pf-opt--wrong pf-opt--reveal'
      return 'pf-opt pf-opt--dim'
    }
    if (isSel) return 'pf-opt pf-opt--sel'
    return 'pf-opt'
  }

  const canCheck = selected.size > 0 && !submitted

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt
        title={<>¿Qué palabras llevan el sonido {exercise.ipa}?</>}
        hint="Puedes elegir más de una"
      />

      <div className="flex justify-center">
        <PhonemePlayButton
          ariaLabel={`Escuchar ${exercise.ipa}`}
          ipa={exercise.ipa}
          caption={exercise.ipa}
          size="lg"
        />
      </div>

      <div
        role="group"
        aria-label="Opciones — selecciona todas las que contienen el sonido"
        className={cn('pf-options', !focusUi && 'pf-options--grid')}
      >
        {exercise.options.map((opt, i) => (
          <button
            key={opt.id}
            type="button"
            aria-pressed={selected.has(opt.id)}
            aria-label={`Seleccionar ${opt.label}`}
            aria-disabled={submitted}
            onClick={() => toggle(opt.id, opt.label)}
            className={optClass(opt.id)}
          >
            {focusUi && <span className="pf-opt__key">{i + 1}</span>}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {!submitted && (
        <PhonemeConfirmButton onClick={handleSubmit} disabled={!canCheck} />
      )}
    </div>
  )
}
