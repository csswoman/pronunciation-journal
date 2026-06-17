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

function WordDisplay({ word, ipa, onListen }: { word?: string; ipa: string; onListen: () => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-3">
        <div
          className="text-5xl font-bold text-(--fg-primary) tracking-tight leading-none"
          style={{ fontFamily: 'Fraunces, Georgia, serif' }}
        >
          {word ?? '—'}
        </div>
        <button
          type="button"
          onClick={onListen}
          aria-label="Listen"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-raised border border-border-default shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-150 cursor-pointer shrink-0"
        >
          <Volume2 size={16} className="text-(--fg-primary)" aria-hidden />
        </button>
      </div>
      <div className="text-sm text-(--fg-tertiary)" style={{ fontFamily: 'var(--font-ipa), monospace' }}>
        {ipa}
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function SpeakScoredExercise({ exercise, onSubmit }: Props) {
  const { status, result: speechResult, isSupported, start, stop, reset } = useSpeechRecognition()
  const [scored, setScored] = useState<ScoredResult | null>(null)
  const [isScoring, setIsScoring] = useState(false)
  const submitted = useRef(false)


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

  if (!isSupported) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-(--fg-secondary)">
          Your browser does not support speech recognition. Try Chrome or Edge.
        </p>
      </div>
    )
  }

  const isListening = status === 'listening'
  const isDone = status === 'done'
  const isError = status === 'error'

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <h2
        className="text-xl font-semibold text-(--fg-primary) text-center leading-snug m-0"
        style={{ fontFamily: 'Fraunces, Georgia, serif' }}
      >
        Say the word
      </h2>

      <WordDisplay
        word={exercise.targetWord}
        ipa={exercise.ipa}
        onListen={() => exercise.targetWord && speak(exercise.targetWord)}
      />

      {/* Mic button — hidden once scored */}
      {!scored && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={isListening ? stop : start}
            disabled={isDone || isScoring}
            aria-label={isListening ? 'Stop recording' : 'Record my voice'}
            className={cn(
              'w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all text-white disabled:opacity-40',
              isListening
                ? 'bg-error shadow-[0_0_0_14px_color-mix(in_oklch,var(--error)_18%,transparent)]'
                : 'bg-primary shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]',
            )}
          >
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
          <p className="text-xs text-fg-subtle tracking-wider m-0">
            {isListening ? 'Listening… tap to stop' : isScoring ? 'Analyzing…' : 'Tap to speak'}
          </p>
        </div>
      )}

      {/* Error state */}
      {isError && !scored && (
        <p className="text-xs text-(--fg-secondary) text-center m-0">
          Speech recognition requires an internet connection.{' '}
          <button type="button" onClick={handleRetry} className="underline cursor-pointer bg-transparent border-none font-[inherit] text-xs text-(--fg-secondary)">
            Retry
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
              className="text-xs py-1.5 px-3 rounded-(--radius-full) border border-border-subtle bg-transparent text-fg-muted cursor-pointer font-[inherit]"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="text-xs py-1.5 px-3 rounded-(--radius-full) bg-primary text-white border-none cursor-pointer font-[inherit] font-medium"
            >
              Continue
            </button>
          </div>
        </>
      )}
    </div>
  )
}
