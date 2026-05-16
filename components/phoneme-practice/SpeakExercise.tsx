'use client'

import { useEffect } from 'react'
import { Mic, MicOff, RotateCcw } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
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
  const { status, result, isSupported, start, stop, reset } = useSpeechRecognition()

  // Play model pronunciation on mount
  useEffect(() => {
    if (exercise.targetWord) {
      const t = setTimeout(() => speak(exercise.targetWord!), 400)
      return () => clearTimeout(t)
    }
  }, [exercise.targetWord])

  // Auto-evaluate when recognition finishes
  useEffect(() => {
    if (status === 'done' && result && exercise.targetWord) {
      const correct = isMatch(result.transcript, exercise.targetWord)
      onSubmit(correct, result.transcript)
    }
  }, [status, result, exercise.targetWord, onSubmit])

  if (!isSupported) {
    return (
      <div className="text-center space-y-3 py-4">
        <p className="text-sm text-fg-muted">
          Speech recognition is not supported in this browser.
          Try Chrome or Edge.
        </p>
      </div>
    )
  }

  const isListening = status === 'listening'
  const isDone = status === 'done'
  const isError = status === 'error'

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <p className="text-xs font-bold uppercase tracking-widest text-fg-muted">
          Pronounce this word
        </p>
        <p className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {exercise.targetWord ?? '—'}
        </p>
        <p className="text-sm font-mono" style={{ color: 'var(--primary)' }}>
          {exercise.ipa}
        </p>
      </div>

      {/* Replay model + mic button */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => exercise.targetWord && speak(exercise.targetWord)}
          className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
          style={{ borderColor: 'var(--line-divider)', color: 'var(--fg-muted)' }}
        >
          🔊 Hear model
        </button>

        <button
          type="button"
          onClick={isListening ? stop : start}
          aria-label={isListening ? 'Stop recording' : 'Start recording'}
          className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-[1.04]"
          style={{
            backgroundColor: isListening ? 'var(--error)' : 'var(--primary)',
            color: 'white',
            boxShadow: isListening
              ? '0 0 0 14px color-mix(in oklch, var(--error) 18%, transparent)'
              : '0 4px 16px color-mix(in oklch, var(--primary) 35%, transparent)',
          }}
        >
          {isListening ? <MicOff size={28} /> : <Mic size={28} />}
        </button>

        <p className="text-xs font-medium tracking-wide text-fg-muted">
          {isListening ? 'Recording… tap to stop' : 'Tap to speak'}
        </p>
      </div>

      {/* Result or error state */}
      {isDone && result && (
        <div className="text-center text-sm text-fg-muted">
          You said: <span className="font-semibold text-fg">{result.transcript}</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-error text-center">
            Could not hear anything. Make sure your microphone is allowed.
          </p>
          <Button
            onClick={reset}
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
          >
            <RotateCcw size={13} /> Try again
          </Button>
        </div>
      )}
    </div>
  )
}
