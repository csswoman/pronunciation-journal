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

  const inputStyle: React.CSSProperties = submitted
    ? isCorrect
      ? {
          borderColor: 'var(--admonitions-color-tip)',
          backgroundColor: 'oklch(.93 .05 180)',
          color: 'var(--admonitions-color-tip)',
        }
      : {
          borderColor: 'var(--admonitions-color-caution)',
          backgroundColor: 'oklch(.95 .05 25)',
          color: 'var(--admonitions-color-caution)',
        }
    : {
        borderColor: 'var(--line-divider)',
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-primary)',
      }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          Listen and type what you hear
        </p>
        <button
          onClick={() => exercise.targetWord && speak(exercise.targetWord)}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-3xl transition-colors"
          style={{
            backgroundColor: 'var(--btn-regular-bg)',
            color: 'var(--admonitions-color-warning)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg)')}
        >
          🔊
        </button>
        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>Tap to replay</p>
      </div>

      <div className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => !submitted && setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Type the word..."
          className="w-full px-4 py-3 rounded-xl border-2 text-center text-lg font-medium outline-none transition-colors"
          style={inputStyle}
        />

        {submitted && !isCorrect && (
          <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Correct answer: <span className="font-bold text-success">{exercise.targetWord}</span>
          </p>
        )}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="btn-primary w-full py-3 rounded-xl font-semibold disabled:opacity-40"
        >
          Check
        </button>
      )}
    </div>
  )
}
