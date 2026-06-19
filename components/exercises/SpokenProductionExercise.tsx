'use client'

// Planned structure:
// <SpokenProductionExercise>
//   <ProductionTaskHeader />
//   <MicButton />
//   <OfflineBanner />
//   <ProductionFeedback />
//   <SubmitActions />
// </SpokenProductionExercise>

import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { PillButton } from '@/components/ui/PillButton'
import { ProductionFeedback } from '@/components/exercises/ProductionFeedback'
import { ProductionTaskHeader } from '@/components/exercises/ProductionTaskHeader'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import {
  gradeProduction,
  isOnline,
  ProductionGradeError,
} from '@/lib/exercises/grade-production-client'
import type { ProductionGradeResult } from '@/lib/exercises/production-grade'
import type { SpokenProductionExercise as SpokenProductionExerciseType } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'
import { cn } from '@/lib/cn'

interface Props {
  exercise: SpokenProductionExerciseType
  onResult: (
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: GenericRenderExtras,
  ) => void
}

export function SpokenProductionExercise({ exercise, onResult }: Props) {
  const { status, result: speechResult, errorCode, isSupported, start, stop, reset } =
    useSpeechRecognition()
  const [grading, setGrading] = useState(false)
  const [grade, setGrade] = useState<ProductionGradeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(true)
  const startMs = useRef(Date.now())
  const submitted = useRef(false)

  useEffect(() => {
    setGrade(null)
    setError(null)
    setGrading(false)
    submitted.current = false
    startMs.current = Date.now()
    setOnline(isOnline())
    reset()
  }, [exercise.id, reset])

  useEffect(() => {
    function syncOnline() { setOnline(isOnline()) }
    window.addEventListener('online', syncOnline)
    window.addEventListener('offline', syncOnline)
    return () => {
      window.removeEventListener('online', syncOnline)
      window.removeEventListener('offline', syncOnline)
    }
  }, [])

  const runGrading = useCallback(async (transcript: string) => {
    if (!isOnline()) {
      setError('Free production needs an internet connection to grade your answer.')
      return
    }
    setGrading(true)
    setError(null)
    try {
      const result = await gradeProduction({
        targetItem: exercise.targetItem,
        targetMeaning: exercise.targetMeaning,
        taskPrompt: exercise.taskPrompt,
        production: transcript,
        modality: 'spoken',
      })
      setGrade(result)
    } catch (err) {
      const msg = err instanceof ProductionGradeError
        ? err.message
        : 'Grading failed. Please try again.'
      setError(msg)
    } finally {
      setGrading(false)
    }
  }, [exercise])

  useEffect(() => {
    if (status !== 'done' || !speechResult || grading || grade) return
    const transcript = speechResult.transcript.trim()
    if (!transcript) {
      setError('No speech detected. Tap the mic and speak clearly.')
      return
    }
    void runGrading(transcript)
  }, [status, speechResult, grading, grade, runGrading])

  const handleContinue = useCallback(() => {
    if (!grade || submitted.current) return
    submitted.current = true
    const transcript = speechResult?.transcript.trim() ?? ''
    onResult(grade.correct, transcript, Date.now() - startMs.current, { score: grade.score })
  }, [grade, speechResult, onResult])

  const handleRetry = useCallback(() => {
    submitted.current = false
    setGrade(null)
    setError(null)
    reset()
    startMs.current = Date.now()
  }, [reset])

  if (!isSupported) {
    return (
      <p className="text-sm text-fg-muted text-center">
        Your browser does not support speech recognition. Try Chrome or Edge.
      </p>
    )
  }

  const isListening = status === 'listening'
  const isDone = status === 'done'
  const isMicError = status === 'error'

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <ProductionTaskHeader exercise={exercise} title="Say your sentence" />

      {!online && !grade && (
        <p className="m-0 w-full rounded-[var(--radius-md)] border border-warning-border bg-warning-soft px-3 py-2 text-sm text-warning">
          You&apos;re offline. Connect to record and grade your answer.
        </p>
      )}

      {!grade && (
        <>
          {!isMicError && (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={isListening ? stop : start}
                disabled={isDone || grading || !online}
                aria-label={isListening ? 'Stop recording' : 'Record my voice'}
                className={cn(
                  'flex h-20 w-20 items-center justify-center rounded-full border-none text-on-primary transition-all focus-ring disabled:opacity-40 cursor-pointer',
                  isListening
                    ? 'bg-error shadow-[0_0_0_14px_color-mix(in_oklch,var(--error)_18%,transparent)]'
                    : 'bg-primary shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]',
                )}
              >
                {isListening ? <MicOff size={28} /> : <Mic size={28} />}
              </button>
              <p className="m-0 text-xs tracking-wider text-fg-subtle">
                {isListening ? 'Listening… tap to stop' : grading ? 'Grading…' : 'Tap to speak'}
              </p>
            </div>
          )}

          {isMicError && (
            <p className="m-0 text-xs text-center text-fg-muted">
              {errorCode === 'not-allowed'
                ? 'Microphone access was denied.'
                : errorCode === 'no-speech'
                  ? 'No speech detected. Tap the mic and speak clearly.'
                  : 'Speech recognition failed.'}{' '}
              <button
                type="button"
                onClick={handleRetry}
                className="cursor-pointer border-none bg-transparent text-xs text-fg-muted underline focus-ring"
              >
                Retry
              </button>
            </p>
          )}

          {error && <p className="m-0 text-sm text-error">{error}</p>}
        </>
      )}

      {grade && (
        <>
          <ProductionFeedback
            grade={grade}
            transcript={speechResult?.transcript.trim()}
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
