'use client'

import { useEffect, useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { cn } from '@/lib/cn'
import { PhonemeExercisePrompt } from './PhonemeExercisePrompt'
import { getPhonemeExerciseMeta } from '@/lib/phoneme-practice/exercise-labels'

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
  const meta = getPhonemeExerciseMeta('dictation', { targetWord: exercise.targetWord })

  useEffect(() => {
    if (exercise.targetWord) {
      const timer = setTimeout(() => speak(exercise.targetWord!, { voice }), 300)
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

  function handlePlay() {
    setPlayed(true)
    if (exercise.targetWord) speak(exercise.targetWord, { voice })
  }

  const canCheck = value.trim().length > 0 && !submitted

  const playControl = (
    <div className="pf-play-wrap">
      <button
        type="button"
        onClick={handlePlay}
        aria-label={played ? 'Reproducir de nuevo' : 'Reproducir audio'}
        className={cn('pf-play-btn', played && 'pf-play-btn--played')}
      >
        ▶
      </button>
    </div>
  )

  const input = (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => !submitted && setValue(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      placeholder="escribe aquí…"
      aria-label="Tu respuesta"
      aria-invalid={submitted && !isCorrect}
      className={cn(
        'pf-type-in',
        submitted && (isCorrect ? 'pf-type-in--correct' : 'pf-type-in--wrong'),
      )}
    />
  )

  const checkBtn = !submitted && (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={!canCheck}
      aria-label="Comprobar respuesta"
      className="pf-cta pf-cta--primary"
    >
      Comprobar
    </button>
  )

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt eyebrow={meta.eyebrow} />
      {playControl}
      {input}
      {submitted && !isCorrect && (
        <p className="pf-answer-note">
          Respuesta: <strong>{exercise.targetWord}</strong>
        </p>
      )}
      {checkBtn}
    </div>
  )
}
