'use client'

// Planned structure:
// <SpokenProductionExercise>
//   <ProductionTaskHeader />
//   <SpokenProductionControls />
//   <SpokenProductionFeedbackActions />
// </SpokenProductionExercise>

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ProductionTaskHeader } from '@/components/exercises/ProductionTaskHeader'
import { useEnterToContinue } from '@/hooks/useEnterToContinue'
import { useSharedMicStream } from '@/hooks/useSharedMicStream'
import { useSpeechInput } from '@/hooks/useSpeechInput'
import { useVoiceLevel } from '@/hooks/useVoiceLevel'
import {
  gradeProduction,
  isOnline,
  ProductionGradeError,
} from '@/lib/exercises/grade-production-client'
import { pedagogicalFeedbackFromProductionGrade } from '@/lib/exercises/feedback'
import { rehearsedPatternForConstraint } from '@/lib/exercises/error-patterns'
import type { ProductionGradeResult } from '@/lib/exercises/production-grade'
import type { SpokenProductionExercise as SpokenProductionExerciseType } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'
import {
  SpokenProductionControls,
  SpokenProductionFeedbackActions,
  SpokenProductionUnscored,
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
  } = useSpeechInput({
    prefer: 'auto',
    getStream,
    endpoint: '/api/gemini/transcribe-sentence',
  })
  const [grading, setGrading] = useState(false)
  const [grade, setGrade] = useState<ProductionGradeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(true)
  const [recordingMs, setRecordingMs] = useState(0)
  // El stream vive aquí (no en useSharedMicStream) sólo para alimentar el
  // analizador del osciloscopio. Los tracks los sigue soltando `release`.
  const [micStream, setMicStream] = useState<MediaStream | null>(null)
  const { getSamples, peak } = useVoiceLevel(micStream)
  const startMs = useRef(Date.now())
  const submitted = useRef(false)
  const errorId = useId()

  useEffect(() => {
    setGrade(null)
    setError(null)
    setGrading(false)
    setRecordingMs(0)
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

  // Un contador visible da prueba de que el micro sigue capturando: el pulso
  // CSS por sí solo no distingue "grabando" de "congelado".
  useEffect(() => {
    if (speechState !== 'listening') return
    setRecordingMs(0)
    const startedAt = Date.now()
    const id = window.setInterval(() => {
      setRecordingMs(Date.now() - startedAt)
    }, 200)
    return () => window.clearInterval(id)
  }, [speechState])

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
      errorPattern: grade.errorPattern,
      rehearsedPattern: exercise.constraint?.id
        ? (rehearsedPatternForConstraint(exercise.constraint.id) ?? undefined)
        : undefined,
    })
  }, [grade, speechResult, exercise.constraint, onResult])

  // Sin micrófono el intento no se puede juzgar: se cierra como no puntuado
  // para que no cuente como fallo del estudiante.
  const handleUnscoredDone = useCallback(() => {
    if (submitted.current) return
    submitted.current = true
    onResult(false, '', Date.now() - startMs.current, { resultStatus: 'unscored' })
  }, [onResult])

  const handleRetry = useCallback(() => {
    submitted.current = false
    setGrade(null)
    setError(null)
    setRecordingMs(0)
    setMicStream(null)
    reset()
    release()
    startMs.current = Date.now()
  }, [reset, release])

  const handleToggleMic = useCallback(async () => {
    if (speechState === 'listening') {
      setError(null)
      setMicStream(null)
      await stop()
      return
    }
    setError(null)
    reset()
    try {
      setMicStream(await getStream())
      await start()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'not-allowed'
      setError(
        msg === 'not-allowed'
          ? 'Se denegó el acceso al micrófono. Habilita los permisos.'
          : 'No se pudo acceder al micrófono.',
      )
      setMicStream(null)
      release()
    }
  }, [speechState, stop, reset, getStream, start, release])

  useEnterToContinue(Boolean(grade && !grading), handleContinue)

  const isListening = speechState === 'listening'
  // El reconocedor pasa por 'processing' mientras la transcripción está en
  // vuelo. Sin exponerlo, la UI caía al estado inicial ("Toca para hablar")
  // justo cuando el audio ya se estaba procesando.
  const isTranscribing = speechState === 'processing'
  const isDone = speechState === 'done'
  const isMicError = speechState === 'error'
  const elapsedLabel = isListening
    ? `${Math.floor(recordingMs / 60000)}:${String(Math.floor(recordingMs / 1000) % 60).padStart(2, '0')}`
    : null

  return (
    <div
      className="flex w-full flex-col items-stretch justify-start gap-4"
      aria-busy={grading || undefined}
    >
      <ProductionTaskHeader exercise={exercise} title="Di tu oración" />

      {/* Sin micrófono no hay nada que transcribir, pero leer la oración en voz
          alta sigue siendo la práctica: se ofrece el modelo y una salida que no
          puntúa, en vez de dejar el ejercicio sin ninguna acción posible. */}
      {!isSupported && !grade && (
        <SpokenProductionUnscored
          exampleSentence={exercise.exampleSentence}
          onContinue={handleUnscoredDone}
        />
      )}

      {isSupported && !grade && (
        <SpokenProductionControls
          exampleSentence={exercise.exampleSentence}
          exerciseId={exercise.id}
          online={online}
          isListening={isListening}
          isTranscribing={isTranscribing}
          isDone={isDone}
          grading={grading}
          elapsedLabel={elapsedLabel}
          getSamples={getSamples}
          peak={peak}
          isMicError={isMicError}
          speechError={speechError}
          error={error}
          errorId={errorId}
          onToggleMic={handleToggleMic}
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
