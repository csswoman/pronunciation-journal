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
import { useRecordingElapsed } from '@/hooks/useRecordingElapsed'
import { useSharedMicStream } from '@/hooks/useSharedMicStream'
import { useSpeechInput } from '@/hooks/useSpeechInput'
import { useVoiceLevel } from '@/hooks/useVoiceLevel'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useProductionGrading } from '@/hooks/useProductionGrading'
import { AI_GRADES_SPENT_MESSAGE } from '@/lib/exercises/grading-attempts'
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
  const [grade, setGrade] = useState<ProductionGradeResult | null>(null)
  const [micError, setMicError] = useState<string | null>(null)
  const online = useOnlineStatus()
  // Local-first grading: cached and repeated transcripts never reach the AI,
  // and only two versions per exercise are graded (Plan 037 C2).
  const {
    grade: gradeProductionLocalFirst,
    clearError,
    grading,
    error: gradingError,
    aiBudgetSpent,
  } = useProductionGrading({ exerciseKey: exercise.id })
  const error = micError ?? gradingError
  // El stream vive aquí (no en useSharedMicStream) sólo para alimentar el
  // analizador del osciloscopio. Los tracks los sigue soltando `release`.
  const [micStream, setMicStream] = useState<MediaStream | null>(null)
  const { getSamples, peak } = useVoiceLevel(micStream)
  const startMs = useRef(Date.now())
  const submitted = useRef(false)
  const errorId = useId()

  useEffect(() => {
    setGrade(null)
    setMicError(null)
    submitted.current = false
    startMs.current = Date.now()
    reset()
  }, [exercise.id, reset])

  useEffect(() => release, [release])

  const runGrading = useCallback(
    async (transcript: string) => {
      setMicError(null)
      const result = await gradeProductionLocalFirst({
        targetItem: exercise.targetItem,
        targetMeaning: exercise.targetMeaning,
        taskPrompt: exercise.taskPrompt,
        production: transcript,
        modality: 'spoken',
        level: exercise.level,
        constraintCheck: exercise.constraint?.checkEn,
      })
      if (result) setGrade(result)
    },
    [exercise, gradeProductionLocalFirst],
  )

  useEffect(() => {
    if (speechState !== 'done' || !speechResult || grading || grade) return
    const transcript = speechResult.transcript.trim()
    if (!transcript) {
      setMicError('No se detectó voz. Toca el micrófono y habla con claridad.')
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
    setMicError(null)
    clearError()
    setMicStream(null)
    reset()
    release()
    startMs.current = Date.now()
  }, [reset, release, clearError])

  const handleToggleMic = useCallback(async () => {
    if (speechState === 'listening') {
      setMicError(null)
      setMicStream(null)
      await stop()
      return
    }
    setMicError(null)
    clearError()
    reset()
    try {
      setMicStream(await getStream())
      await start()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'not-allowed'
      setMicError(
        msg === 'not-allowed'
          ? 'Se denegó el acceso al micrófono. Habilita los permisos.'
          : 'No se pudo acceder al micrófono.',
      )
      setMicStream(null)
      release()
    }
  }, [speechState, stop, reset, getStream, start, release, clearError])

  useEnterToContinue(Boolean(grade && !grading), handleContinue)

  const isListening = speechState === 'listening'
  const elapsedLabel = useRecordingElapsed(isListening)
  // El reconocedor pasa por 'processing' mientras la transcripción está en
  // vuelo. Sin exponerlo, la UI caía al estado inicial ("Toca para hablar")
  // justo cuando el audio ya se estaba procesando.
  const isTranscribing = speechState === 'processing'
  const isDone = speechState === 'done'
  const isMicError = speechState === 'error'
  // Presupuesto de IA agotado: la salida es comparar con el modelo, no seguir
  // grabando intentos que nadie va a corregir.
  const selfAssess = aiBudgetSpent && !grade

  return (
    <div
      className="flex w-full flex-col items-stretch justify-start gap-4"
      aria-busy={grading || undefined}
    >
      <ProductionTaskHeader exercise={exercise} title="Di tu oración" />

      {/* Sin micrófono no hay nada que transcribir, pero leer la oración en voz
          alta sigue siendo la práctica: se ofrece el modelo y una salida que no
          puntúa, en vez de dejar el ejercicio sin ninguna acción posible. Con el
          presupuesto de correcciones agotado se toma la misma salida. */}
      {(!isSupported || selfAssess) && !grade && (
        <SpokenProductionUnscored
          exampleSentence={exercise.exampleSentence}
          message={selfAssess ? AI_GRADES_SPENT_MESSAGE : undefined}
          onContinue={handleUnscoredDone}
        />
      )}

      {isSupported && !selfAssess && !grade && (
        <SpokenProductionControls
          exampleSentence={exercise.exampleSentence}
          hintAlwaysVisible={exercise.constraint?.id !== 'rodeo_circumlocution'}
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
