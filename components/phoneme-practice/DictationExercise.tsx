'use client'

// Planned structure:
// <DictationExercise>
//   <PhonemeExercisePrompt />
//   <PhonemePlayButton />
//   <AnswerInput />
//   <FeedbackMessage />
//   <PhonemeConfirmButton />
// </DictationExercise>

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

  const rawIpa = exercise.ipa?.replace(/^\/+|\/+$/g, '')
  const ipaDisplay = rawIpa ? `/${rawIpa}/` : undefined

  return (
    <div className="flex w-full flex-col gap-6">
      <PhonemeExercisePrompt
        centered
        title="Escucha y escribe la palabra"
        kicker={ipaDisplay ? `Sonido ${ipaDisplay} · Dictado fonético` : 'Dictado fonético'}
        hint="Escribe exactamente la palabra que escuchas"
      />

      <div className="flex justify-center py-2">
        <PhonemePlayButton
          ariaLabel={exercise.targetWord ? `Escuchar ${exercise.targetWord}` : 'Escuchar audio'}
          word={exercise.targetWord}
          voice={voice}
          size="lg"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="dictation-input" className="text-body-sm font-medium text-fg-muted">
          Tu respuesta
        </label>
        <input
          id="dictation-input"
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => !submitted && setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Escribe la palabra aquí…"
          aria-label="Tu respuesta"
          aria-invalid={submitted && !isCorrect}
          className={cn(
            'min-h-13 w-full rounded-xl border border-border-default bg-surface-sunken/60 px-4 py-3 text-body-lg text-fg placeholder:text-fg-subtle focus-ring transition-all',
            submitted && isCorrect && 'border-success-border bg-success-soft text-success pf-reveal-ok font-semibold',
            submitted && !isCorrect && 'border-error-border bg-error-soft text-error pf-reveal-bad font-semibold',
          )}
        />
      </div>

      {submitted && !isCorrect && (
        <div className="rounded-xl border border-border-default bg-surface-sunken p-4 text-center text-body-md text-fg-muted">
          Palabra correcta: <strong className="font-semibold text-fg">{exercise.targetWord}</strong>
        </div>
      )}

      {!submitted && (
        <PhonemeConfirmButton onClick={handleSubmit} disabled={!canCheck} />
      )}
    </div>
  )
}
