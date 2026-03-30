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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Which word contains
        </p>
        <span className="text-3xl font-bold text-purple-600 dark:text-purple-400 font-mono">
          {exercise.ipa}
        </span>
        <p className="text-xs text-gray-400 mt-1">Tap a word to hear it, then select</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {exercise.options.map(option => {
          const isCorrect = exercise.correctIds.includes(option.id)
          let cls =
            'p-5 rounded-2xl border-2 text-center font-bold text-xl transition-all cursor-pointer '
          if (submitted) {
            if (isCorrect)
              cls += 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            else if (selected === option.id)
              cls += 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            else
              cls += 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
          } else {
            cls += 'border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
          }
          return (
            <button
              key={option.id}
              className={cls}
              onClick={() => handleSelect(option.id)}
              onMouseEnter={() => !submitted && speak(option.label)}
            >
              <div>{option.label}</div>
              <div className="text-xs font-normal mt-1 opacity-60">🔊 hover to hear</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
