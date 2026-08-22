'use client'

// Planned structure:
// <WrittenProductionExercise>
//   <ProductionTaskHeader />
//   <SentenceField />
//   <ProductionHint />
//   <OfflineBanner />
//   <ErrorAlert />
//   <PrimaryActions />
//   <SkipLink />
//   <ProductionFeedback />
//   <FeedbackActions />
// </WrittenProductionExercise>

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { PracticeActionBar, PracticeContinueButton } from '@/components/practice/session/PracticeActionBar'
import { ProductionFeedback } from '@/components/exercises/ProductionFeedback'
import { ProductionHint } from '@/components/exercises/ProductionHint'
import { ProductionTaskHeader } from '@/components/exercises/ProductionTaskHeader'
import {
  gradeProduction,
  isOnline,
  ProductionGradeError,
} from '@/lib/exercises/grade-production-client'
import { pedagogicalFeedbackFromProductionGrade } from '@/lib/exercises/feedback'
import type { ProductionGradeResult } from '@/lib/exercises/production-grade'
import type { WrittenProductionExercise as WrittenProductionExerciseType } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'
import { cn } from '@/lib/cn'

interface Props {
  exercise: WrittenProductionExerciseType
  onResult: (
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: GenericRenderExtras,
  ) => void
  onSkip?: () => void
}

export function WrittenProductionExercise({ exercise, onResult, onSkip }: Props) {
  const [text, setText] = useState('')
  const [grading, setGrading] = useState(false)
  const [grade, setGrade] = useState<ProductionGradeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(true)
  const startMs = useRef(Date.now())
  const submitted = useRef(false)
  const fieldId = useId()
  const errorId = useId()

  useEffect(() => {
    setText('')
    setGrade(null)
    setError(null)
    setGrading(false)
    submitted.current = false
    startMs.current = Date.now()
    setOnline(isOnline())
  }, [exercise.id])

  useEffect(() => {
    function syncOnline() { setOnline(isOnline()) }
    window.addEventListener('online', syncOnline)
    window.addEventListener('offline', syncOnline)
    return () => {
      window.removeEventListener('online', syncOnline)
      window.removeEventListener('offline', syncOnline)
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || grading || grade) return
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
        production: trimmed,
        modality: 'written',
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
  }, [text, grading, grade, exercise])

  const handleContinue = useCallback(() => {
    if (!grade || submitted.current) return
    submitted.current = true
    onResult(grade.correct, text.trim(), Date.now() - startMs.current, {
      score: grade.score,
      feedback: pedagogicalFeedbackFromProductionGrade(grade),
    })
  }, [grade, text, onResult])

  const handleRetry = useCallback(() => {
    submitted.current = false
    setGrade(null)
    setError(null)
    startMs.current = Date.now()
  }, [])

  const handleSelfCheck = useCallback(() => {
    if (!text.trim() || submitted.current) return
    submitted.current = true
    onResult(true, text.trim(), Date.now() - startMs.current, {
      resultStatus: 'unscored',
      feedback: {
        immediate: 'Respuesta completada mediante autoevaluación.',
        expectedAnswer: exercise.exampleSentence,
      },
    })
  }, [text, onResult, exercise.exampleSentence])

  return (
    <div className="flex w-full flex-col justify-start gap-3" aria-busy={grading || undefined}>
      <ProductionTaskHeader exercise={exercise} title="Escribe tu oración" />

      {!online && !grade && (
        <OfflineBanner message="Sin conexión. Conéctate para enviar tu oración o autoevalúate con la solución." />
      )}

      {!grade && (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor={fieldId} className="text-body-sm font-medium text-fg-muted">
              Tu oración
            </label>
            <textarea
              id={fieldId}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={grading}
              rows={4}
              placeholder="Escribe tu oración aquí…"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={cn(
                'w-full min-h-28 resize-none rounded-[var(--radius-sm)] border border-border-default bg-surface-sunken px-3 py-3 text-base text-fg placeholder:text-fg-placeholder',
                'transition-colors duration-150 ease-out-quart disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-error-border',
              )}
            />
          </div>

          <ProductionHint
            exampleSentence={exercise.exampleSentence}
            exerciseId={exercise.id}
          />

          {error && (
            <p id={errorId} role="alert" className="m-0 text-body-sm text-error">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => void handleSubmit()}
              disabled={!text.trim() || grading || !online}
            >
              {grading ? 'Corrigiendo…' : 'Enviar'}
            </Button>
            {(!online || error) && text.trim() && (
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={handleSelfCheck}
              >
                Autoevaluar con ejemplo
              </Button>
            )}
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={grading}
                aria-label="Omitir este ejercicio"
                className="min-h-11 cursor-pointer self-center border-none bg-transparent px-4 text-body-sm font-medium text-fg-subtle transition-colors hover:text-fg-muted focus-ring disabled:cursor-not-allowed disabled:opacity-40"
              >
                Omitir este
              </button>
            )}
          </div>
        </>
      )}

      {grade && (
        <>
          <ProductionFeedback grade={grade} />
          <PracticeActionBar>
            <Button variant="secondary" size="lg" fullWidth onClick={handleRetry}>
              Intentar de nuevo
            </Button>
            <PracticeContinueButton onClick={handleContinue} />
          </PracticeActionBar>
        </>
      )}
    </div>
  )
}

function OfflineBanner({ message }: { message: string }) {
  return (
    <p
      role="status"
      className="m-0 rounded-[var(--radius-sm)] border border-warning-border bg-warning-soft px-3 py-2 text-caption text-warning"
    >
      {message}
    </p>
  )
}
