'use client'

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
      next.has(id) ? next.delete(id) : next.add(id)
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Which words contain this sound?
        </p>
        <span className="text-5xl font-bold text-purple-600 dark:text-purple-400 font-mono">
          {exercise.ipa}
        </span>
        <p className="text-xs text-gray-400 mt-1">Select all that apply</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {exercise.options.map(option => {
          const isSelected = selected.has(option.id)
          const isCorrect = exercise.correctIds.includes(option.id)
          let cls =
            'p-4 rounded-xl border-2 text-center font-medium transition-all cursor-pointer select-none '
          if (submitted) {
            if (isCorrect)
              cls += 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            else if (isSelected)
              cls += 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            else
              cls += 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
          } else {
            cls += isSelected
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
          }
          return (
            <button key={option.id} className={cls} onClick={() => toggle(option.id)}>
              {option.label}
            </button>
          )
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0}
          className="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold disabled:opacity-40 hover:bg-purple-700 transition-colors"
        >
          Check
        </button>
      )}
    </div>
  )
}
