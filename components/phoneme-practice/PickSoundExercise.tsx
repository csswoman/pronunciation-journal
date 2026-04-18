'use client'

import Button from "@/components/ui/Button";
import { useEffect, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

export function PickSoundExercise({ exercise, onSubmit }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (exercise.targetWord) {
      const timer = setTimeout(() => speak(exercise.targetWord!), 300)
      return () => clearTimeout(timer)
    }
  }, [exercise.targetWord])

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
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          Which sound does this word contain?
        </p>
        <Button
          onClick={() => exercise.targetWord && speak(exercise.targetWord)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-2xl transition-colors"
          style={{
            backgroundColor: 'var(--btn-regular-bg)',
            color: 'var(--primary)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg)')}
        >
          <span>🔊</span>
          {exercise.targetWord}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {exercise.options.map(option => (
          <Button
            key={option.id}
            className="p-4 rounded-xl border-2 text-center font-mono text-lg font-bold transition-all cursor-pointer"
            style={getOptionStyle(option.id)}
            onClick={() => handleSelect(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

