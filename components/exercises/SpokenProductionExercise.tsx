'use client'

// Planned structure:
// <SpokenProductionExercise>
//   <ProductionTaskHeader />
//   <MicButton />
//   <ProductionHint />
//   <OfflineBanner />
//   <ErrorAlert />
//   <SkipLink />
//   <ProductionFeedback />
//   <FeedbackActions />
// </SpokenProductionExercise>

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Mic, MicOff } from '@/components/icons'
import { PillButton } from '@/components/ui/PillButton'
import { ProductionFeedback } from '@/components/exercises/ProductionFeedback'
import { ProductionHint } from '@/components/exercises/ProductionHint'
import { ProductionTaskHeader } from '@/components/exercises/ProductionTaskHeader'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { BROWSER_BLOCKS_STT_ES } from '@/lib/speech/browser-support-message'
import {
  gradeProduction,
  isOnline,
  ProductionGradeError,
} from '@/lib/exercises/grade-production-client'
import { pedagogicalFeedbackFromProductionGrade } from '@/lib/exercises/feedback'
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
  onSkip?: () => void
}

export function SpokenProductionExercise({ exercise, onResult, onSkip }: Props) {
  const { status, result: speechResult, errorCode, isSupported, start, stop, reset } =
    useSpeechRecognition()
  const [grading, setGrading] = useState(false)
  const [grade, setGrade] = useState<ProductionGradeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(true)
  const startMs = useRef(Date.now())
  const submitted = useRef(false)
  const errorId = useId()

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
      setError('Necesitas conexión a internet para corregir tu respuesta.')
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
        level: exercise.level,
      })
      setGrade(result)
    } catch (err) {
      const msg = err instanceof ProductionGradeError
        ? err.message
        : 'No se pudo corregir. Inténtalo de nuevo.'
      setError(msg)
    } finally {
      setGrading(false)
    }
  }, [exercise])

  useEffect(() => {
    if (status !== 'done' || !speechResult || grading || grade) return
    const transcript = speechResult.transcript.trim()
    if (!transcript) {
      setError('No se detectó voz. Toca el micrófono y habla con claridad.')
      return
    }
    void runGrading(transcript)
  }, [status, speechResult, grading, grade, runGrading])

  const handleContinue = useCallback(() => {
    if (!grade || submitted.current) return
    submitted.current = true
    const transcript = speechResult?.transcript.trim() ?? ''
    onResult(grade.correct, transcript, Date.now() - startMs.current, {
      score: grade.score,
      feedback: pedagogicalFeedbackFromProductionGrade(grade),
    })
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
      <p className="text-center text-sm text-fg-muted">
        Tu navegador no admite reconocimiento de voz. Prueba Chrome o Edge.
      </p>
    )
  }

  const isListening = status === 'listening'
  const isDone = status === 'done'
  const isMicError = status === 'error'

  return (
    <div
      className="flex w-full flex-col items-stretch justify-start gap-3"
      aria-busy={grading || undefined}
    >
      <ProductionTaskHeader exercise={exercise} title="Di tu oración" />

      {!online && !grade && (
        <p
          role="status"
          className="m-0 w-full rounded-[var(--radius-md)] border border-warning-border bg-warning-soft px-3 py-2 text-sm text-warning"
        >
          Sin conexión. Conéctate para grabar y corregir tu respuesta.
        </p>
      )}

      {!grade && (
        <>
          {!isMicError && (
            <div className="flex flex-col items-center gap-2 py-2">
              <button
                type="button"
                onClick={isListening ? stop : start}
                disabled={isDone || grading || !online}
                aria-label={isListening ? 'Detener grabación' : 'Grabar mi voz'}
                className={cn(
                  'flex h-20 w-20 items-center justify-center rounded-full border-none text-on-primary transition-all focus-ring disabled:opacity-40 cursor-pointer',
                  isListening
                    ? 'bg-error shadow-[0_0_0_14px_color-mix(in_oklch,var(--error)_18%,transparent)]'
                    : 'bg-primary shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]',
                )}
              >
                {isListening ? <MicOff size={28} /> : <Mic size={28} />}
              </button>
              <p className="m-0 text-sm text-fg-subtle">
                {isListening
                  ? 'Escuchando… toca para parar'
                  : grading
                    ? 'Corrigiendo…'
                    : 'Toca para hablar'}
              </p>
            </div>
          )}

          {isMicError && (
            <p className="m-0 text-center text-sm text-fg-muted" role="alert">
              {errorCode === 'not-allowed'
                ? 'Se denegó el acceso al micrófono.'
                : errorCode === 'no-speech'
                  ? 'No se detectó voz. Toca el micrófono y habla con claridad.'
                  : errorCode === 'network'
                    ? BROWSER_BLOCKS_STT_ES
                    : 'Falló el reconocimiento de voz.'}{' '}
              <button
                type="button"
                onClick={handleRetry}
                className="min-h-11 cursor-pointer border-none bg-transparent px-1 text-sm text-fg-muted underline focus-ring"
              >
                Reintentar
              </button>
            </p>
          )}

          <ProductionHint
            exampleSentence={exercise.exampleSentence}
            exerciseId={exercise.id}
          />

          {error && (
            <p id={errorId} role="alert" className="m-0 text-sm text-error">
              {error}
            </p>
          )}

          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              disabled={grading || isListening}
              aria-label="Omitir este ejercicio"
              className="min-h-11 cursor-pointer self-center border-none bg-transparent px-4 text-sm font-medium text-fg-subtle transition-colors hover:text-fg-muted focus-ring disabled:cursor-not-allowed disabled:opacity-40"
            >
              Omitir este
            </button>
          )}
        </>
      )}

      {grade && (
        <>
          <ProductionFeedback
            grade={grade}
            transcript={speechResult?.transcript.trim()}
          />
          <div className="flex w-full flex-col gap-2">
            <PillButton
              variant="primary"
              size="md"
              className="min-h-11 w-full"
              onClick={handleContinue}
            >
              Continuar
            </PillButton>
            <PillButton
              variant="outline"
              size="md"
              className="min-h-11 w-full"
              onClick={handleRetry}
            >
              Intentar de nuevo
            </PillButton>
          </div>
        </>
      )}
    </div>
  )
}
