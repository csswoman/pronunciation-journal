'use client'

// Planned structure:
// <SpeakScoredExercise>
//   <WordDisplay />            — palabra + IPA
//   <ListenModelButton />      — reproducir modelo (speak)
//   <RecognitionMicButton />   — useSpeechRecognition → transcript
//   <PronunciationFeedback />  — chips de fonema cuando hay resultado
//   <FallbackShadowing />      — cuando SpeechRecognition no disponible
// </SpeakScoredExercise>

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import { speak } from '@/lib/phoneme-practice/tts'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { getFeedbackMessage, calculateXP } from '@/lib/pronunciation/scoring'
import PronunciationFeedback from '@/components/lesson/PronunciationFeedback'
import { SpeakExercise } from '@/components/phoneme-practice/SpeakExercise'
import { cn } from '@/lib/cn'
import type { Exercise } from '@/lib/phoneme-practice/types'
import type { WordResult } from '@/lib/types'

interface Props {
  exercise: Exercise
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
}

interface ScoredResult {
  correct: boolean
  score: number
  wordResults: WordResult[]
  transcript: string
}

// ── WordDisplay ──────────────────────────────────────────────────────────────

function WordDisplay({ word, ipa }: { word?: string; ipa: string }) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[.08em] text-[var(--text-tertiary)] m-0">
        Pronunciation — di la palabra
      </p>
      <div className="[font-family:var(--font-phoneme),serif] text-5xl font-bold text-[var(--text-primary)] tracking-[-1px] leading-none">
        {word ?? '—'}
      </div>
      <div className="[font-family:var(--font-ipa),monospace] text-base text-[var(--primary)]">
        {ipa}
      </div>
    </>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function SpeakScoredExercise({ exercise, onSubmit }: Props) {
  const { status, result: speechResult, isSupported, start, stop, reset } = useSpeechRecognition()
  const [scored, setScored] = useState<ScoredResult | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const submitted = useRef(false)

  // Auto-play model on mount (always runs — hooks must not be conditional)
  useEffect(() => {
    if (!isSupported || !exercise.targetWord) return
    const t = setTimeout(() => speak(exercise.targetWord!), 400)
    return () => clearTimeout(t)
  }, [exercise.targetWord, isSupported])

  // Score when transcript arrives
  useEffect(() => {
    if (!isSupported || status !== 'done' || !speechResult || isScoring || scored) return
    const target = exercise.targetWord ?? ''
    if (!target) return

    setIsScoring(true)
    defaultEvaluationEngine
      .evaluate({
        exercise: { domain: 'pronunciation', mode: 'speak' },
        expected: target,
        actual: { kind: 'speech', transcript: speechResult.transcript },
      })
      .then((evalResult) => {
        setScored({
          correct: evalResult.correct,
          score: evalResult.score ?? 0,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          wordResults: (evalResult as any).wordResults ?? [],
          transcript: speechResult.transcript,
        })
      })
      .finally(() => setIsScoring(false))
  }, [isSupported, status, speechResult, isScoring, scored, exercise.targetWord])

  // Fallback a shadowing cuando el navegador no soporta SpeechRecognition
  if (!isSupported) {
    return <SpeakExercise exercise={exercise} onSubmit={onSubmit} />
  }

  const handleContinue = useCallback(() => {
    if (!scored || submitted.current) return
    submitted.current = true
    onSubmit(scored.correct, scored.transcript)
  }, [scored, onSubmit])

  const handleRetry = useCallback(() => {
    submitted.current = false
    setScored(null)
    reset()
  }, [reset])

  const isListening = status === 'listening'
  const isDone = status === 'done'
  const isError = status === 'error'

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <WordDisplay word={exercise.targetWord} ipa={exercise.ipa} />

      {/* Listen model */}
      <button
        type="button"
        onClick={() => exercise.targetWord && speak(exercise.targetWord)}
        className="inline-flex items-center gap-1.5 text-xs py-2 px-4 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit]"
      >
        <Volume2 size={14} aria-hidden />
        Escuchar modelo
      </button>

      {/* Mic button — hidden once scored */}
      {!scored && (
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={isListening ? stop : start}
            disabled={isDone || isScoring}
            aria-label={isListening ? 'Detener grabación' : 'Grabar mi voz'}
            className={cn(
              'w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all text-white disabled:opacity-40',
              isListening
                ? 'bg-[var(--error)] shadow-[0_0_0_14px_color-mix(in_oklch,var(--error)_18%,transparent)]'
                : 'bg-[var(--primary)] shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]',
            )}
          >
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
          <p className="text-xs text-[var(--text-tertiary)] tracking-[.05em]">
            {isListening ? 'Escuchando… toca para parar' : isScoring ? 'Analizando…' : 'Toca para hablar'}
          </p>
        </div>
      )}

      {/* Error state */}
      {isError && !scored && (
        <p className="text-xs text-[var(--error)] text-center">
          No se pudo iniciar el micrófono.{' '}
          <button type="button" onClick={handleRetry} className="underline cursor-pointer bg-transparent border-none [font-family:inherit] text-xs">
            Reintentar
          </button>
        </p>
      )}

      {/* Rich feedback */}
      {scored && (
        <>
          <PronunciationFeedback
            wordResults={scored.wordResults}
            accuracy={scored.score}
            feedback={getFeedbackMessage(scored.score, 70)}
            xpEarned={calculateXP(scored.score)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRetry}
              className="text-xs py-1.5 px-3 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit]"
            >
              Intentar de nuevo
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="text-xs py-1.5 px-3 rounded-[var(--radius-full)] bg-[var(--primary)] text-white border-none cursor-pointer [font-family:inherit] font-medium"
            >
              Continuar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
