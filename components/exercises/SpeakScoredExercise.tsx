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
import { Mic, MicOff } from 'lucide-react'
import { speak } from '@/lib/phoneme-practice/tts'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { defaultEvaluationEngine } from '@/lib/exercises/evaluation'
import { getFeedbackMessage, calculateXP } from '@/lib/pronunciation/scoring'
import PronunciationFeedback from '@/components/lesson/PronunciationFeedback'
import { PillButton } from '@/components/ui/PillButton'
import { ListenButton } from '@/components/ui/ListenButton'
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
          className="text-5xl font-bold text-fg tracking-tight leading-none"
          style={{ fontFamily: 'Fraunces, Georgia, serif' }}
        >
          {word ?? '—'}
        </div>
        <ListenButton iconOnly onPlay={onListen} aria-label="Listen" />
      </div>
      <div className="text-sm text-fg-subtle" style={{ fontFamily: 'var(--font-ipa), monospace' }}>
        {ipa}
      </div>
    </div>
  )
}

// ── ShadowingFallback ────────────────────────────────────────────────────────
// Used when live speech recognition is unavailable (e.g. Brave blocks Google's
// speech service). No automatic scoring — listen and repeat, then continue.

function ShadowingFallback({ word, onContinue }: { word?: string; onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs text-fg-muted text-center max-w-xs m-0">
        Voice scoring isn’t available in this browser. Listen to the model and
        repeat it out loud, then continue.
      </p>
      <ListenButton onPlay={() => word && speak(word)} label="Listen" />
      <PillButton variant="primary" size="sm" onClick={onContinue}>
        Continue
      </PillButton>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export function SpeakScoredExercise({ exercise, onSubmit }: Props) {
  const { status, result: speechResult, errorCode, isSupported, start, stop, reset } = useSpeechRecognition()
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

  // Shadowing fallback completes the exercise without a transcript/score.
  const handleShadowingDone = useCallback(() => {
    if (submitted.current) return
    submitted.current = true
    onSubmit(true, '')
  }, [onSubmit])

  if (!isSupported) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-fg-muted">
          Your browser does not support speech recognition. Try Chrome or Edge.
        </p>
      </div>
    )
  }

  const isListening = status === 'listening'
  const isDone = status === 'done'
  const isError = status === 'error'
  // Browsers like Brave block Google's speech service → fall back to shadowing.
  const isShadowing = isError && errorCode === 'network'

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <h2
        className="text-xl font-semibold text-fg text-center leading-snug m-0"
        style={{ fontFamily: 'Fraunces, Georgia, serif' }}
      >
        Say the word
      </h2>

      <WordDisplay
        word={exercise.targetWord}
        ipa={exercise.ipa}
        onListen={() => exercise.targetWord && speak(exercise.targetWord)}
      />

      {/* Mic button — hidden once scored or when shadowing */}
      {!scored && !isShadowing && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={isListening ? stop : start}
            disabled={isDone || isScoring}
            aria-label={isListening ? 'Stop recording' : 'Record my voice'}
            className={cn(
              'w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all text-on-primary focus-ring disabled:opacity-40',
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

      {/* Shadowing fallback — speech service unavailable (e.g. Brave) */}
      {isShadowing && !scored && (
        <ShadowingFallback word={exercise.targetWord} onContinue={handleShadowingDone} />
      )}

      {/* Error state (recoverable errors) */}
      {isError && !isShadowing && !scored && (
        <p className="text-xs text-fg-muted text-center m-0">
          {errorCode === 'not-allowed'
            ? 'Microphone access was denied. Allow microphone access in your browser settings.'
            : errorCode === 'no-speech'
              ? 'No speech detected. Tap the mic and speak clearly.'
              : 'Speech recognition failed.'}{' '}
          <button type="button" onClick={handleRetry} className="underline cursor-pointer bg-transparent border-none font-[inherit] text-xs text-fg-muted focus-ring">
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
            <PillButton variant="outline" size="sm" onClick={handleRetry}>
              Try again
            </PillButton>
            <PillButton variant="primary" size="sm" onClick={handleContinue}>
              Continue
            </PillButton>
          </div>
        </>
      )}
    </div>
  )
}
