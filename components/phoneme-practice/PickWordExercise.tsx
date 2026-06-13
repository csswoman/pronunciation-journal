'use client'

import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { speak } from '@/lib/phoneme-practice/tts'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import { cn } from '@/lib/cn'
import { PhonemeExercisePrompt } from './PhonemeExercisePrompt'
import { getPhonemeExerciseMeta } from '@/lib/phoneme-practice/exercise-labels'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
}

export function PickWordExercise({ exercise, onSubmit, focusUi = false }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const meta = getPhonemeExerciseMeta('pick_word', { ipa: exercise.ipa })

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
      <div className="flex flex-col items-center gap-5 w-full">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => playIpaSound(exercise.ipa.replace(/[/\[\]]/g, '').trim())}
            aria-label={`Pronunciar ${exercise.ipa}`}
            className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] text-[var(--text-primary)] text-[15px] font-mono hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors cursor-pointer [font-family:inherit]"
          >
            <Volume2 size={13} className="text-[var(--text-tertiary)]" aria-hidden />
            {exercise.ipa}
          </button>
          <p className="text-[15px] text-[var(--text-secondary)] text-center m-0">
            Which words contain this sound?
          </p>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] text-center tracking-[.05em] m-0">
          Select all that apply
        </p>
        {options}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canCheck}
          style={canCheck ? { backgroundImage: 'var(--gradient-primary)' } : undefined}
          className={[
            'w-full p-4 rounded-[var(--radius-md)] border-none [font-family:inherit] text-[15px] font-semibold transition-all',
            canCheck
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
        eyebrow={meta.eyebrow}
        title={meta.title}
        hint="Selecciona todas las que apliquen"
      />
      <button
        type="button"
        onClick={() => playIpaSound(exercise.ipa.replace(/[/\[\]]/g, '').trim())}
        aria-label={`Escuchar ${exercise.ipa}`}
        className="pf-chip pf-chip--ipa self-center mb-4"
      >
        <Volume2 size={13} className="pf-chip__icon" aria-hidden />
        {exercise.ipa}
      </button>
      {options}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canCheck}
        className="pf-cta pf-cta--primary"
      >
        Comprobar
      </button>
    </div>
  )
}
