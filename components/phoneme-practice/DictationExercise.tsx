'use client'

import { useEffect, useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { cn } from '@/lib/cn'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  voice?: SpeechSynthesisVoice
}

function levenshtein(a: string, b: string): number {
  const m = a.length,
    n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

export function DictationExercise({ exercise, onSubmit, voice }: Props) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [played, setPlayed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
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

  function handlePlay() {
    setPlayed(true)
    if (exercise.targetWord) speak(exercise.targetWord, { voice })
  }

  const canCheck = value.trim().length > 0 && !submitted

  const input = (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => !submitted && setValue(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      placeholder="Type here…"
      aria-label="Your answer"
      aria-invalid={submitted && !isCorrect}
      className={cn(
        'w-full px-4 py-3 rounded-xl text-base text-(--fg-primary) bg-surface-raised',
        'border border-border-default outline-none transition-all duration-150',
        'placeholder:text-(--fg-disabled)',
        'focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_18%,transparent)]',
        submitted && isCorrect && 'bg-success-soft border-success-border text-success',
        submitted && !isCorrect && 'bg-error-soft border-error-border text-error',
      )}
    />
  )

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <h2
        className="text-xl font-semibold text-(--fg-primary) text-center leading-snug m-0"
        style={{ fontFamily: 'Fraunces, Georgia, serif' }}
      >
        Listen and write the word
      </h2>

      <button
        type="button"
        onClick={handlePlay}
        aria-label={played ? 'Play again' : 'Play audio'}
        className={[
          'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150',
          'bg-surface-raised border border-border-default shadow-sm',
          'hover:shadow-md hover:-translate-y-px cursor-pointer',
        ].join(' ')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7 text-(--fg-primary)"
          aria-hidden
        >
          <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.348 2.595.342 1.241 1.519 1.905 2.66 1.905H6.44l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
          <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>

      {input}

      {submitted && !isCorrect && (
        <p className="text-sm text-(--fg-secondary) text-center m-0">
          Answer: <strong className="text-(--fg-primary)">{exercise.targetWord}</strong>
        </p>
      )}

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canCheck}
          aria-label="Check answer"
          className={[
            'w-full py-4 rounded-xl font-semibold text-[15px] transition-all duration-150',
            canCheck
              ? 'bg-(--cta-bg) text-(--cta-fg) cursor-pointer hover:-translate-y-px shadow-md'
              : 'bg-surface-raised text-(--fg-disabled) cursor-not-allowed border border-border-subtle',
          ].join(' ')}
        >
          Check
        </button>
      )}
    </div>
  )
}
