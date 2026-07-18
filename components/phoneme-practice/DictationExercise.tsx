'use client'

import { useEffect, useRef, useState } from 'react'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeConfirmButton } from '@/components/phoneme-practice/PhonemeConfirmButton'
import { PhonemeExercisePrompt } from '@/components/phoneme-practice/PhonemeExercisePrompt'
import { PhonemePlayButton } from '@/components/phoneme-practice/PhonemePlayButton'
import { cn } from '@/lib/cn'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  voice?: SpeechSynthesisVoice
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
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

  const canCheck = value.trim().length > 0 && !submitted

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt
        centered
        title="Escucha y escribe la palabra"
      />

      <PhonemePlayButton
        ariaLabel={exercise.targetWord ? `Escuchar ${exercise.targetWord}` : 'Escuchar audio'}
        word={exercise.targetWord}
        voice={voice}
      />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => !submitted && setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder="Escribe aquí…"
        aria-label="Tu respuesta"
        aria-invalid={submitted && !isCorrect}
        className={cn(
          'w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-base text-(--fg-primary)',
          'outline-none transition-all duration-150',
          'placeholder:text-(--fg-disabled)',
          'focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_18%,transparent)]',
          submitted && isCorrect && 'border-success-border bg-success-soft text-success pf-reveal-ok',
          submitted && !isCorrect && 'border-error-border bg-error-soft text-error pf-reveal-bad',
        )}
      />

      {submitted && !isCorrect && (
        <p className="m-0 text-center text-sm text-(--fg-secondary)">
          Respuesta: <strong className="text-(--fg-primary)">{exercise.targetWord}</strong>
        </p>
      )}

      {!submitted && (
        <PhonemeConfirmButton onClick={handleSubmit} disabled={!canCheck} />
      )}
    </div>
  )
}
