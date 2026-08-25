'use client'

// Planned structure:
// <SpokenProductionExercise>
//   <ProductionTaskHeader />
//   <SpokenProductionControls />
//   <SpokenProductionFeedbackActions />
// </SpokenProductionExercise>

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ProductionTaskHeader } from '@/components/exercises/ProductionTaskHeader'
import { useSharedMicStream } from '@/hooks/useSharedMicStream'
import { useSpeechInput } from '@/hooks/useSpeechInput'
import {
  gradeProduction,
  isOnline,
  ProductionGradeError,
} from '@/lib/exercises/grade-production-client'
import { pedagogicalFeedbackFromProductionGrade } from '@/lib/exercises/feedback'
import type { ProductionGradeResult } from '@/lib/exercises/production-grade'
import type { SpokenProductionExercise as SpokenProductionExerciseType } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'
import {
  SpokenProductionControls,
  SpokenProductionFeedbackActions,
} from './SpokenProductionParts'

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
  const { getStream, release } = useSharedMicStream()
  const {
    state: speechState,
    result: speechResult,
    error: speechError,
    isSupported,
    start,
    stop,
    reset,
  } = useSpeechInput({ prefer: 'gemini', getStream })
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
    function syncOnline() {
      setOnline(isOnline())
    }
    window.addEventListener('online', syncOnline)
    window.addEventListener('offline', syncOnline)
    return () => {
      window.removeEventListener('online', syncOnline)
      window.removeEventListener('offline', syncOnline)
    }
  }, [])

  useEffect(() => release, [release])

  const runGrading = useCallback(
    async (transcript: string) => {
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
          constraintCheck: exercise.constraint?.checkEn,
        })
        setGrade(result)
      } catch (err) {
        const msg =
          err instanceof ProductionGradeError
            ? err.message
            : 'No se pudo corregir. Inténtalo de nuevo.'
        setError(msg)
      } finally {
        setGrading(false)
      }
    },
    [exercise],
  )

  useEffect(() => {
    if (speechState !== 'done' || !speechResult || grading || grade) return
    const transcript = speechResult.transcript.trim()
    if (!transcript) {
      setError('No se detectó voz. Toca el micrófono y habla con claridad.')
      return
    }
    void runGrading(transcript)
  }, [speechState, speechResult, grading, grade, runGrading])

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
      <p className="text-center text-body-sm text-fg-muted">
        Tu navegador no admite reconocimiento de voz. Prueba Chrome o Edge.
      </p>
    )
  }

  const isListening = speechState === 'listening'
  const isDone = speechState === 'done'
  const isMicError = speechState === 'error'

  return (
    <div
      className="flex w-full flex-col items-stretch justify-start gap-3"
      aria-busy={grading || undefined}
    >
      <ProductionTaskHeader exercise={exercise} title="Di tu oración" />

      {!grade && (
        <SpokenProductionControls
          exampleSentence={exercise.exampleSentence}
          exerciseId={exercise.id}
          online={online}
          isListening={isListening}
          isDone={isDone}
          grading={grading}
          isMicError={isMicError}
          speechError={speechError}
          error={error}
          errorId={errorId}
          onToggleMic={isListening ? stop : start}
          onRetry={handleRetry}
          onSkip={onSkip}
        />
      )}

      {grade && (
        <SpokenProductionFeedbackActions
          grade={grade}
          transcript={speechResult?.transcript.trim()}
          onContinue={handleContinue}
          onRetry={handleRetry}
        />
      )}
    </div>
  )
}
