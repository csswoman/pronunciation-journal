'use client'

import Button from "@/components/ui/Button";
import { useState } from 'react'
import type { Exercise } from '@/lib/phoneme-practice/types'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

export function PickWordExercise({ exercise, onSubmit }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)

  function toggle(id: string) {
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

  function getOptionStyle(id: string): React.CSSProperties {
    const isSelected = selected.has(id)
    const isCorrect = exercise.correctIds.includes(id)
    if (submitted) {
      if (isCorrect) return {
        borderColor: 'var(--admonitions-color-tip)',
        backgroundColor: 'oklch(.93 .05 180)',
        color: 'var(--admonitions-color-tip)',
      }
      if (isSelected) return {
        borderColor: 'var(--admonitions-color-caution)',
        backgroundColor: 'oklch(.95 .05 25)',
        color: 'var(--admonitions-color-caution)',
      }
      return {
        borderColor: 'var(--line-divider)',
        color: 'var(--text-tertiary)',
      }
    }
    if (isSelected) return {
      borderColor: 'var(--primary)',
      backgroundColor: 'var(--selection-bg)',
      color: 'var(--primary)',
    }
    return {
      borderColor: 'var(--line-divider)',
      color: 'var(--text-primary)',
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
          Which words contain this sound?
        </p>
        <span className="text-5xl font-bold font-mono" style={{ color: 'var(--primary)' }}>
          {exercise.ipa}
        </span>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Select all that apply</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {exercise.options.map(option => (
          <Button
            key={option.id}
            className="p-4 rounded-xl border-2 text-center font-medium transition-all cursor-pointer select-none"
            style={getOptionStyle(option.id)}
            onClick={() => toggle(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={selected.size === 0}
          className="btn-primary w-full py-3 rounded-xl font-semibold disabled:opacity-40"
        >
          Check
        </Button>
      )}
    </div>
  )
}

