'use client'

import { useEffect } from 'react'
import { Mic, MicOff, RotateCcw, Volume2 } from 'lucide-react'
import { useSpeechInput } from '@/hooks/useSpeechInput'
import { speak } from '@/lib/phoneme-practice/tts'
import type { Exercise } from '@/lib/phoneme-practice/types'
import { cn } from '@/lib/cn'
import { PhonemeExercisePrompt } from './PhonemeExercisePrompt'
import { getPhonemeExerciseMeta } from '@/lib/phoneme-practice/exercise-labels'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
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

function isMatch(transcript: string, target: string): boolean {
  const a = transcript.toLowerCase().trim()
  const b = target.toLowerCase().trim()
  return a === b || levenshtein(a, b) <= 1
}

export function SpeakExercise({ exercise, onSubmit, focusUi = false }: Props) {
  const { state, result, isSupported, start, stop, reset } = useSpeechInput({ prefer: 'web-speech' })
  const meta = getPhonemeExerciseMeta('speak_word', { targetWord: exercise.targetWord })

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
          El reconocimiento de voz no está disponible. Prueba Chrome o Edge.
        </p>
      </div>
    )
  }

  const isListening = state === 'listening'
  const isDone = state === 'done'
  const isError = state === 'error'

  const wordBlock = focusUi ? (
    <div className="pf-pron">
      <div className="pf-pron__word">{exercise.targetWord ?? '—'}</div>
      <div className="pf-pron__ipa">{exercise.ipa}</div>
    </div>
  ) : (
    <>
      <p className="text-xs font-semibold uppercase tracking-[.08em] text-[var(--text-tertiary)] m-0">
        Pronounce this word
      </p>
      <div className="[font-family:var(--font-phoneme),serif] text-5xl font-bold text-[var(--text-primary)] tracking-[-1px] leading-none">
        {exercise.targetWord ?? '—'}
      </div>
      <div className="[font-family:var(--font-ipa),monospace] text-base text-[var(--primary)]">
        {exercise.ipa}
      </div>
    </>
  )

  const listenBtn = focusUi ? (
    <div className="pf-listen-row">
      <button
        type="button"
        onClick={() => exercise.targetWord && speak(exercise.targetWord)}
        className="pf-chip"
      >
        <Volume2 size={16} aria-hidden />
        Escuchar modelo
      </button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => exercise.targetWord && speak(exercise.targetWord)}
      className="text-xs font-medium py-2 px-4 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit]"
    >
      🔊 Hear model
    </button>
  )

  const mic = (
    <button
      type="button"
      onClick={isListening ? stop : start}
      aria-label={isListening ? 'Detener grabación' : 'Empezar a hablar'}
      className={cn(
        focusUi ? 'pf-mic' : 'w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all text-white',
        focusUi && isListening && 'pf-mic--rec',
        !focusUi &&
          (isListening
            ? 'bg-[var(--error)] shadow-[0_0_0_14px_color-mix(in_oklch,var(--error)_18%,transparent)]'
            : 'bg-[var(--primary)] shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]'),
      )}
    >
      {isListening ? <MicOff size={28} /> : <Mic size={28} />}
    </button>
  )

  const content = (
    <>
      {wordBlock}
      {listenBtn}
      <div className={focusUi ? 'pf-mic-wrap' : 'flex flex-col items-center gap-2'}>
        {mic}
        <p className={focusUi ? 'pf-mic-label' : 'text-xs text-[var(--text-tertiary)] tracking-[.05em]'}>
          {isListening ? 'Escuchando… toca para parar' : 'Toca para hablar'}
        </p>
      </div>
      {isDone && result && (
        <p className={focusUi ? 'pf-transcript' : 'text-sm text-[var(--text-secondary)] text-center'}>
          Dijiste: <strong>{result.transcript}</strong>
        </p>
      )}
      {isError && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-[var(--error)] text-center">
            No se escuchó nada. Comprueba los permisos del micrófono.
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 text-xs py-1 px-3 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit]"
          >
            <RotateCcw size={13} /> Intentar de nuevo
          </button>
        </div>
      )}
    </>
  )

  if (!focusUi) {
    return <div className="flex flex-col items-center gap-5 w-full">{content}</div>
  }

  return (
    <div className="phoneme-focus__exercise">
      <PhonemeExercisePrompt eyebrow={meta.eyebrow} />
      {content}
    </div>
  )
}
