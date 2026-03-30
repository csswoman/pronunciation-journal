'use client'

import { useEffect, useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

export function DictationExercise({ exercise, onSubmit }: Props) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (exercise.targetWord) {
      const timer = setTimeout(() => speak(exercise.targetWord!), 300)
      return () => clearTimeout(timer)
    }
  }, [exercise.targetWord])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSubmit() {
    if (submitted || !value.trim()) return
    const normalized = value.trim().toLowerCase()
    const target = (exercise.targetWord ?? '').toLowerCase()
    const correct = normalized === target || levenshtein(normalized, target) <= 1
    setIsCorrect(correct)
    setSubmitted(true)
    onSubmit(correct, value.trim())
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Listen and type what you hear
        </p>
        <button
          onClick={() => exercise.targetWord && speak(exercise.targetWord)}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold text-3xl hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
        >
          🔊
        </button>
        <p className="text-xs text-gray-400 mt-2">Tap to replay</p>
      </div>

      <div className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => !submitted && setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Type the word..."
          className={`w-full px-4 py-3 rounded-xl border-2 text-center text-lg font-medium outline-none transition-colors
            ${submitted
              ? isCorrect
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'border-gray-200 dark:border-gray-700 focus:border-amber-400 dark:focus:border-amber-500 bg-white dark:bg-gray-800'
            }`}
        />

        {submitted && !isCorrect && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Correct answer: <span className="font-bold text-green-600 dark:text-green-400">{exercise.targetWord}</span>
          </p>
        )}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="w-full py-3 rounded-xl bg-amber-500 text-white font-semibold disabled:opacity-40 hover:bg-amber-600 transition-colors"
        >
          Check
        </button>
      )}
    </div>
  )
}
