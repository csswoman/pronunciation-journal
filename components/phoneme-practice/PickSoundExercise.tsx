'use client'

import { useEffect, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeExercisePrompt } from './PhonemeExercisePrompt'
import { getPhonemeExerciseMeta } from '@/lib/phoneme-practice/exercise-labels'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
  voice?: SpeechSynthesisVoice
}

export function PickSoundExercise({ exercise, onSubmit, focusUi = false, voice }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const meta = getPhonemeExerciseMeta('pick_sound', { ipa: exercise.ipa })

  useEffect(() => {
    if (exercise.targetWord) {
      const timer = setTimeout(() => speak(exercise.targetWord!, { voice }), 300)
      return () => clearTimeout(timer)
    }
  }, [exercise.targetWord, voice])

  function handleSelect(id: string, label: string) {
    if (submitted) return
    playIpaSound(label.replace(/[/\[\]]/g, '').trim())
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
      if (isCorrect) return 'pf-opt pf-opt--ipa pf-opt--correct'
      if (selected === id) return 'pf-opt pf-opt--ipa pf-opt--wrong'
      return 'pf-opt pf-opt--ipa pf-opt--dim'
    }
    if (selected === id) return 'pf-opt pf-opt--ipa pf-opt--sel'
    return 'pf-opt pf-opt--ipa'
  }

  const canCheck = Boolean(selected) && !submitted

  const body = (
    <>
      <button
        type="button"
        onClick={() => exercise.targetWord && speak(exercise.targetWord, { voice })}
        className={focusUi ? 'pf-chip self-center mb-5' : 'inline-flex items-center gap-2 bg-[var(--surface-raised)] border-[1.5px] border-[var(--border-subtle)] rounded-[var(--radius-full)] py-3 px-6 text-lg font-semibold text-[var(--text-primary)] cursor-pointer [font-family:inherit]'}
      >
        <span className={focusUi ? 'pf-chip__icon' : undefined} aria-hidden>
          🔊
        </span>
        {exercise.targetWord}
      </button>

      <div
        role="radiogroup"
        aria-label={`Sonido en "${exercise.targetWord}"`}
        className="pf-options pf-options--grid"
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

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canCheck}
        className={focusUi ? 'pf-cta pf-cta--primary' : [
            'w-full p-4 rounded-[var(--radius-md)] border-none [font-family:inherit] text-[15px] font-semibold transition-all',
            canCheck
              ? 'cursor-pointer text-on-primary shadow-md hover:-translate-y-[1px]'
              : 'cursor-not-allowed bg-surface-raised text-fg-subtle',
          ].join(' ')}
        style={!focusUi && canCheck ? { backgroundImage: 'var(--gradient-primary)' } : undefined}
      >
        {focusUi ? 'Comprobar' : 'Check'}
      </button>
    </>
  )

  if (!focusUi) {
    return (
      <div className="flex flex-col items-center gap-5 w-full">
        <p className="text-[15px] text-[var(--text-secondary)] text-center m-0">
          Which sound does this word contain?
        </p>
        {body}
      </div>
    )
  }

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt eyebrow={meta.eyebrow} title={meta.title} />
      {body}
    </div>
  )
}
