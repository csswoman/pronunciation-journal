'use client'

import { useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

export function MinimalPairExercise({ exercise, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function handleSelect(id: string) {
    if (submitted) return
    setSelected(id)
    setSubmitted(true)
    const isCorrect = exercise.correctIds.includes(id)
    const label = exercise.options.find(o => o.id === id)?.label ?? ''
    onSubmit(isCorrect, label)
  }

  function getOptionStyle(id: string): React.CSSProperties {
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect) return {
        borderColor: 'var(--admonitions-color-tip)',
        backgroundColor: 'oklch(.93 .05 180)',
        color: 'var(--admonitions-color-tip)',
      }
      if (selected === id) return {
        borderColor: 'var(--admonitions-color-caution)',
        backgroundColor: 'oklch(.95 .05 25)',
        color: 'var(--admonitions-color-caution)',
      }
      return {
        borderColor: 'var(--line-divider)',
        color: 'var(--text-tertiary)',
      }
    }
    return {
      borderColor: 'var(--line-divider)',
      color: 'var(--text-primary)',
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
          Which word contains
        </p>
        <span className="text-3xl font-bold font-mono" style={{ color: 'var(--primary)' }}>
          {exercise.ipa}
        </span>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Tap a word to hear it, then select</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {exercise.options.map(option => (
          <button
            key={option.id}
            className="p-5 rounded-2xl border-2 text-center font-bold text-xl transition-all cursor-pointer"
            style={getOptionStyle(option.id)}
            onClick={() => handleSelect(option.id)}
            onMouseEnter={() => !submitted && speak(option.label)}
          >
            <div>{option.label}</div>
            <div className="text-xs font-normal mt-1 opacity-60">🔊 hover to hear</div>
          </button>
        ))}
      </div>
    </div>
  )
}
