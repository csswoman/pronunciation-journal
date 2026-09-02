'use client'

// Planned structure:
// <PickWordExercise>
//   <AuditoryDiscriminationBase (mode="multi")>
//     <PhonemePlayButton />
//   </AuditoryDiscriminationBase>
// </PickWordExercise>

import { useState } from 'react'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { speak } from '@/lib/phoneme-practice/tts'
import { PhonemePlayButton } from '@/components/phoneme-practice/PhonemePlayButton'
import { AuditoryDiscriminationBase } from '@/components/phoneme-practice/AuditoryDiscriminationBase'
import { playUiCue } from '@/lib/ui-sounds/cues'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
}

export function PickWordExercise({ exercise, onSubmit }: Props) {
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

  const canCheck = selected.size > 0 && !submitted
  const rawIpa = exercise.ipa?.replace(/^\/+|\/+$/g, '')
  const ipaDisplay = rawIpa ? `/${rawIpa}/` : undefined

  const stimulusSlot = (
    <PhonemePlayButton
      ariaLabel={`Escuchar ${exercise.ipa}`}
      ipa={exercise.ipa}
      caption={exercise.ipa}
      size="lg"
    />
  )

  return (
    <AuditoryDiscriminationBase
      title={<>¿Qué palabras llevan el sonido <span className="font-ipa text-primary">{ipaDisplay ?? exercise.ipa}</span>?</>}
      kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Selección múltiple` : 'Selección múltiple'}
      hint="Puedes seleccionar más de una opción que contenga el fonema"
      stimulusSlot={stimulusSlot}
      options={exercise.options}
      selectedIds={[...selected]}
      correctIds={exercise.correctIds}
      submitted={submitted}
      mode="multi"
      canConfirm={canCheck}
      onToggleOption={toggle}
      onConfirm={handleSubmit}
    />
  )
}
