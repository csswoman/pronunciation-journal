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
  focusUi?: boolean
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

export function DictationExercise({ exercise, onSubmit, focusUi = false, voice }: Props) {
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

  const playControl = focusUi ? (
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
  ) : (
    <button
      type="button"
      onClick={handlePlay}
      aria-label={played ? 'Play audio again' : 'Play audio'}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full py-3 px-7 text-[15px] font-semibold cursor-pointer w-full transition-all duration-200',
        played
          ? 'bg-[var(--surface-raised)] border border-[1.5px] border-solid border-[var(--border-subtle)] text-[var(--text-primary)]'
          : 'bg-[var(--gradient-primary)] border-0 text-white',
      ].join(' ')}
    >
      🔊 {played ? 'Play again' : 'Play audio'}
    </button>
  )

  const input = (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => !submitted && setValue(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      placeholder={focusUi ? 'escribe aquí…' : 'Type the word…'}
      aria-label="Tu respuesta"
      aria-invalid={submitted && !isCorrect}
      className={cn(
        focusUi ? 'pf-type-in' : 'w-full rounded-[var(--radius-md)] text-base py-4 px-4 text-center border border-[1.5px] border-solid outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 transition-[border-color] duration-200',
        focusUi && submitted && (isCorrect ? 'pf-type-in--correct' : 'pf-type-in--wrong'),
        !focusUi &&
          (submitted
            ? isCorrect
              ? 'bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--success)]'
              : 'bg-[var(--error-soft)] border-[var(--error-border)] text-[var(--error)]'
            : 'bg-[var(--surface-raised)] border-[var(--border-subtle)] text-[var(--text-primary)]'),
      )}
    />
  )

  const checkBtn = !submitted && (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={!canCheck}
      aria-label="Comprobar respuesta"
      className={
        focusUi
          ? 'pf-cta pf-cta--primary'
          : [
              'w-full py-4 rounded-[var(--radius-md)] border-0 text-[15px] font-semibold transition-all duration-[250ms]',
              canCheck
                ? 'cursor-pointer bg-[var(--gradient-primary)] text-white shadow-[0_4px_20px_color-mix(in_oklch,var(--primary)_30%,transparent)]'
                : 'cursor-not-allowed bg-[var(--surface-raised)] text-[var(--text-tertiary)]',
            ].join(' ')
      }
    >
      {focusUi ? 'Comprobar' : 'Check'}
    </button>
  )

  if (!focusUi) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <p className="text-[15px] text-[var(--text-secondary)] text-center m-0">
          Listen and write what you hear
        </p>
        {playControl}
        {input}
        {submitted && !isCorrect && (
          <p className="text-[13px] text-[var(--text-tertiary)] text-center m-0">
            Answer: <strong className="text-[var(--text-primary)]">{exercise.targetWord}</strong>
          </p>
        )}
        {checkBtn}
      </div>
    )
  }

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
