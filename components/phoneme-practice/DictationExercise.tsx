'use client'

// Planned structure:
// <DictationExercise>
//   <PhonemeExercisePrompt />
//   <PhonemeStimulusCard>
//     <PhonemePlayButton />
//     <SpeedToggle />
//   </PhonemeStimulusCard>
//   <AnswerInput />
//   <FeedbackMessage />
//   <PhonemeConfirmButton />
// </DictationExercise>

import { useEffect, useRef, useState } from 'react'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { PhonemeConfirmButton } from '@/components/phoneme-practice/PhonemeConfirmButton'
import { PhonemeExercisePrompt } from '@/components/phoneme-practice/PhonemeExercisePrompt'
import { PhonemePlayButton } from '@/components/phoneme-practice/PhonemePlayButton'
import { PhonemeStimulusCard } from '@/components/phoneme-practice/PhonemeStimulusCard'
import { cn } from '@/lib/cn'

const SLOW_RATE = 0.5
const NORMAL_RATE = 0.9

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
  const [slow, setSlow] = useState(true)
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

      <PhonemeStimulusCard
        button={
          <PhonemePlayButton
            ariaLabel={exercise.targetWord ? `Escuchar ${exercise.targetWord}` : 'Escuchar audio'}
            word={exercise.targetWord}
            voice={voice}
            rate={slow ? SLOW_RATE : NORMAL_RATE}
            size="lg"
            className="size-18border-transparent bg-ink text-white shadow-none hover:border-transparent hover:bg-ink hover:text-white"
          />
        }
        caption={
          <button
            type="button"
            onClick={() => setSlow((s) => !s)}
            aria-pressed={slow}
            className="cursor-pointer rounded-full border-2 border-ink px-5 py-2 text-body-md font-semibold text-ink! transition-colors focus-ring hover:bg-ink/10"
          >
            {slow ? '0.5× Lento' : '1× Normal'}
          </button>
        }
      />

      <div className="flex flex-col gap-2">
        <label htmlFor="dictation-input" className="text-body-sm font-semibold text-fg">
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
            'min-h-13 w-full rounded-xl border-2 border-transparent bg-surface-sunken px-4 py-3 text-body-lg font-medium text-fg placeholder:text-fg-subtle focus:border-primary focus-visible:outline-none transition-all',
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
