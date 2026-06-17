'use client'

import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { speak } from '@/lib/phoneme-practice/tts'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
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
      if (isCorrect) return 'pf-opt pf-opt--correct'
      if (isSel) return 'pf-opt pf-opt--wrong'
      return 'pf-opt pf-opt--dim'
    }
    if (isSel) return 'pf-opt pf-opt--sel'
    return 'pf-opt'
  }

  const canCheck = selected.size > 0 && !submitted

  const options = (
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
  )

  if (!focusUi) {
    return (
      <div className="flex flex-col gap-5 w-full">
        <p className="font-[Fraunces,Georgia,serif] text-2xl font-bold leading-tight text-fg">
          Which words contain the sound {exercise.ipa}?
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => playIpaSound(exercise.ipa.replace(/[/\[\]]/g, '').trim())}
            aria-label={`Play ${exercise.ipa}`}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border-default bg-surface-raised text-fg text-[15px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            <Volume2 size={13} className="text-fg-subtle" aria-hidden />
            {exercise.ipa}
          </button>
        </div>
        {options}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canCheck}
          className={cn(
            'w-full rounded-full py-3.5 text-[15px] font-semibold transition-all duration-150',
            canCheck
              ? 'bg-(--cta-bg) text-(--cta-fg) cursor-pointer hover:opacity-90 active:scale-[0.99]'
              : 'bg-surface-raised text-fg-subtle cursor-not-allowed opacity-50',
          )}
        >
          Check
        </button>
      </div>
    )
  }

  return (
    <div className="phoneme-focus__exercise">
      <p className="font-[Fraunces,Georgia,serif] text-2xl font-bold leading-tight text-fg mb-4">
        Which words contain the sound {exercise.ipa}?
      </p>
      <div className="flex justify-center mb-4">
        <button
          type="button"
          onClick={() => playIpaSound(exercise.ipa.replace(/[/\[\]]/g, '').trim())}
          aria-label={`Play ${exercise.ipa}`}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-border-default bg-surface-raised text-fg text-[15px] font-mono hover:border-primary hover:text-primary transition-colors cursor-pointer"
        >
          <Volume2 size={13} className="text-fg-subtle" aria-hidden />
          {exercise.ipa}
        </button>
      </div>
      {options}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canCheck}
        className={cn(
          'w-full rounded-full py-3.5 text-[15px] font-semibold transition-all duration-150 mt-2',
          canCheck
            ? 'bg-(--cta-bg) text-(--cta-fg) cursor-pointer hover:opacity-90 active:scale-[0.99]'
            : 'bg-surface-raised text-fg-subtle cursor-not-allowed opacity-50',
        )}
      >
        Check
      </button>
    </div>
  )
}
