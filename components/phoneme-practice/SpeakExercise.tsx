'use client'

import { useEffect } from 'react'
import { Mic, MicOff, RotateCcw } from 'lucide-react'
import { useSpeechInput } from '@/hooks/useSpeechInput'
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
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
  return dp[m][n]
}

function isMatch(transcript: string, target: string): boolean {
  const a = transcript.toLowerCase().trim()
  const b = target.toLowerCase().trim()
  return a === b || levenshtein(a, b) <= 1
}

export function SpeakExercise({ exercise, onSubmit }: Props) {
  const { state, result, isSupported, start, stop, reset } = useSpeechInput({ prefer: 'web-speech' })

  useEffect(() => {
    if (exercise.targetWord) {
      const t = setTimeout(() => speak(exercise.targetWord!), 400)
      return () => clearTimeout(t)
    }
  }, [exercise.targetWord])

  useEffect(() => {
    if (state === 'done' && result && exercise.targetWord) {
      const correct = isMatch(result.transcript, exercise.targetWord)
      onSubmit(correct, result.transcript)
    }
  }, [state, result, exercise.targetWord, onSubmit])

  if (!isSupported) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Speech recognition not supported. Try Chrome or Edge.
        </p>
      </div>
    )
  }

  const isListening = state === 'listening'
  const isDone = state === 'done'
  const isError = state === 'error'

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <p className="text-xs font-semibold uppercase tracking-[.08em] text-[var(--text-tertiary)] m-0">
        Pronounce this word
      </p>
      <div className="[font-family:var(--font-phoneme),serif] text-5xl font-bold text-[var(--text-primary)] tracking-[-1px] leading-none">
        {exercise.targetWord ?? '—'}
      </div>
      <div className="[font-family:var(--font-ipa),monospace] text-base text-[var(--primary)]">
        {exercise.ipa}
      </div>

      <button
        type="button"
        onClick={() => exercise.targetWord && speak(exercise.targetWord)}
        className="text-xs font-medium py-2 px-4 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit]"
      >
        🔊 Hear model
      </button>

      <button
        type="button"
        onClick={isListening ? stop : start}
        aria-label={isListening ? 'Stop recording' : 'Start recording'}
        className={[
          'w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all text-white',
          isListening
            ? 'bg-[var(--error)] shadow-[0_0_0_14px_color-mix(in_oklch,var(--error)_18%,transparent)]'
            : 'bg-[var(--primary)] shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]',
        ].join(' ')}
      >
        {isListening ? <MicOff size={28} /> : <Mic size={28} />}
      </button>

      <p className="text-xs text-[var(--text-tertiary)] tracking-[.05em]">
        {isListening ? 'Recording… tap to stop' : 'Tap to speak'}
      </p>

      {isDone && result && (
        <p className="text-sm text-[var(--text-secondary)] text-center">
          You said: <strong className="text-[var(--text-primary)]">{result.transcript}</strong>
        </p>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-[var(--error)] text-center">
            Could not hear anything. Make sure your microphone is allowed.
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 text-xs py-1 px-3 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit]"
          >
            <RotateCcw size={13} /> Try again
          </button>
        </div>
      )}
    </div>
  )
}
