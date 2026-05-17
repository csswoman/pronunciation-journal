'use client'

import { useState } from 'react'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { playIpaSound } from '@/lib/ipa-audio'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

const BASE_OPT = 'rounded-[var(--radius-full)] py-4 px-3 text-[15px] font-medium cursor-pointer transition-all w-full [font-family:inherit] border-[1.5px]'

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'en-US'
  utt.rate = 0.85
  window.speechSynthesis.speak(utt)
}


export function PickWordExercise({ exercise, onSubmit }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)

  function toggle(id: string, label: string) {
    speak(label)
    if (submitted) return
    setSelected(prev => {
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
      selected.size === correctSet.size &&
      [...selected].every(id => correctSet.has(id))
    const userAnswer = exercise.options
      .filter(o => selected.has(o.id))
      .map(o => o.label)
      .join(', ')
    onSubmit(isCorrect, userAnswer)
  }

  function getClass(id: string): string {
    const isSel = selected.has(id)
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect) return `${BASE_OPT} bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--success)]`
      if (isSel)     return `${BASE_OPT} bg-[var(--error-soft)] border-[var(--error-border)] text-[var(--error)]`
      return `${BASE_OPT} bg-[var(--surface-raised)] border-[var(--border-subtle)] text-[var(--text-primary)] opacity-[0.45]`
    }
    if (isSel) return `${BASE_OPT} bg-[var(--selection-bg)] border-[var(--primary)] text-[var(--primary)]`
    return `${BASE_OPT} bg-[var(--surface-raised)] border-[var(--border-subtle)] text-[var(--text-primary)]`
  }

  const canCheck = selected.size > 0 && !submitted

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => playIpaSound(exercise.ipa.replace(/[/\[\]]/g, '').trim())}
          aria-label={`Pronounce ${exercise.ipa}`}
          className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] text-[var(--text-primary)] text-[15px] font-mono hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors cursor-pointer [font-family:inherit]"
        >
          <span className="text-[11px] text-[var(--text-tertiary)]" aria-hidden>🔊</span>
          {exercise.ipa}
        </button>
        <p className="text-[15px] text-[var(--text-secondary)] text-center m-0">
          Which words contain this sound?
        </p>
      </div>
      <p className="text-xs text-[var(--text-tertiary)] text-center tracking-[.05em] m-0">
        Select all that apply
      </p>

      <div className="grid grid-cols-2 gap-3 w-full">
        {exercise.options.map(opt => (
          <button key={opt.id} type="button" onClick={() => toggle(opt.id, opt.label)} className={getClass(opt.id)}>
            {opt.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canCheck}
        className={[
          'w-full p-4 rounded-[var(--radius-md)] border-none [font-family:inherit] text-[15px] font-semibold transition-all',
          canCheck
            ? 'cursor-pointer bg-[var(--gradient-primary)] text-white shadow-[0_4px_20px_color-mix(in_oklch,var(--primary)_30%,transparent)]'
            : 'cursor-not-allowed bg-[var(--surface-raised)] text-[var(--text-tertiary)]',
        ].join(' ')}
      >
        Check
      </button>
    </div>
  )
}
