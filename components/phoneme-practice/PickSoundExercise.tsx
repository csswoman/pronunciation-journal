'use client'

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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Which sound does this word contain?
        </p>
        <button
          onClick={() => exercise.targetWord && speak(exercise.targetWord)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-2xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        >
          <span>🔊</span>
          {exercise.targetWord}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {exercise.options.map(option => {
          const isCorrect = exercise.correctIds.includes(option.id)
          let cls =
            'p-4 rounded-xl border-2 text-center font-mono text-lg font-bold transition-all cursor-pointer '
          if (submitted) {
            if (isCorrect)
              cls += 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            else if (selected === option.id)
              cls += 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            else
              cls += 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
          } else {
            cls += 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
          }
          return (
            <button key={option.id} className={cls} onClick={() => handleSelect(option.id)}>
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
