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
import { PillButton } from '@/components/ui/PillButton'
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

  return (
    <div className="flex w-full flex-col gap-5" aria-busy={grading || undefined}>
      <ProductionTaskHeader exercise={exercise} title="Escribe tu oración" />

      {!online && !grade && (
        <OfflineBanner message="Sin conexión. Conéctate para enviar tu oración y recibir feedback." />
      )}

      {!grade && (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor={fieldId} className="text-sm font-medium text-fg-muted">
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
            <p id={errorId} role="alert" className="m-0 text-sm text-error">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <PillButton
              variant="primary"
              size="md"
              className="min-h-11 w-full"
              onClick={() => void handleSubmit()}
              disabled={!text.trim() || grading || !online}
            >
              {grading ? 'Corrigiendo…' : 'Enviar'}
            </PillButton>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={grading}
                aria-label="Omitir este ejercicio"
                className="min-h-11 cursor-pointer self-center border-none bg-transparent px-4 text-sm font-medium text-fg-subtle transition-colors hover:text-fg-muted focus-ring disabled:cursor-not-allowed disabled:opacity-40"
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

function OfflineBanner({ message }: { message: string }) {
  return (
    <p
      role="status"
      className="m-0 rounded-[var(--radius-md)] border border-warning-border bg-warning-soft px-3 py-2 text-sm text-warning"
    >
      {message}
    </p>
  )
}
