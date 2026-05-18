'use client'

// Planned structure:
// <SentenceDictationExercise>
//   <PlayButton />
//   <TextInput />
//   <CheckButton />
//   <AnswerReveal />

import { useEffect, useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import type { SentenceDictationExercise as SentenceDictationExerciseType } from '@/lib/exercises/types'

interface Props {
  exercise: SentenceDictationExerciseType
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

function normalize(s: string): string {
  return s.toLowerCase().replace(/[.,!?;:'"]/g, '').trim()
}

export function SentenceDictationExercise({ exercise, onSubmit }: Props) {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [played, setPlayed] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => playAudio(), 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id])

  useEffect(() => { inputRef.current?.focus() }, [])

  function playAudio() {
    setPlayed(true)
    if (exercise.audioUrl) {
      const audio = new Audio(exercise.audioUrl)
      audio.play().catch(() => speak(exercise.sentence))
    } else {
      speak(exercise.sentence)
    }
  }

  function handleSubmit() {
    if (submitted || !value.trim()) return
    const userNorm = normalize(value)
    const targetNorm = normalize(exercise.sentence)
    // Allow up to 10% edit distance relative to sentence length
    const threshold = Math.max(2, Math.floor(targetNorm.length * 0.1))
    const correct = levenshtein(userNorm, targetNorm) <= threshold
    setIsCorrect(correct)
    setSubmitted(true)
    onSubmit(correct, value.trim())
  }

  const canCheck = value.trim().length > 0 && !submitted

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <p className="text-[15px] text-[var(--text-secondary)] text-center m-0">
        Listen and write what you hear
      </p>

      <button
        type="button"
        onClick={playAudio}
        className={[
          'inline-flex items-center justify-center gap-2 rounded-full py-3 px-7 text-[15px] font-semibold cursor-pointer w-full transition-all duration-200',
          played
            ? 'bg-[var(--surface-raised)] border border-[1.5px] border-solid border-[var(--border-subtle)] text-[var(--text-primary)]'
            : 'bg-[var(--gradient-primary)] border-0 text-white',
        ].join(' ')}
      >
        🔊 {played ? 'Play again' : 'Play audio'}
      </button>

      <textarea
        ref={inputRef}
        value={value}
        onChange={e => !submitted && setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
        placeholder="Type the sentence…"
        rows={3}
        className={[
          'w-full rounded-[var(--radius-md)] text-base py-4 px-4 border border-[1.5px] border-solid outline-none transition-[border-color] duration-200 resize-none',
          submitted
            ? isCorrect
              ? 'bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--success)]'
              : 'bg-[var(--error-soft)] border-[var(--error-border)] text-[var(--error)]'
            : 'bg-[var(--surface-raised)] border-[var(--border-subtle)] text-[var(--text-primary)]',
        ].join(' ')}
      />

      {submitted && !isCorrect && (
        <p className="text-[13px] text-[var(--text-tertiary)] text-center m-0">
          Answer: <strong className="text-[var(--text-primary)]">{exercise.sentence}</strong>
        </p>
      )}

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canCheck}
          className={[
            'w-full py-4 rounded-[var(--radius-md)] border-0 text-[15px] font-semibold transition-all duration-[250ms]',
            canCheck
              ? 'cursor-pointer bg-[var(--gradient-primary)] text-white'
              : 'cursor-not-allowed bg-[var(--surface-raised)] text-[var(--text-tertiary)]',
          ].join(' ')}
        >
          Check
        </button>
      )}
    </div>
  )
}
