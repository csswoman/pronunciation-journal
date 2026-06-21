'use client'

// Planned structure:
// <WrittenProductionExercise>
//   <ProductionTaskHeader />
//   <ProductionTextarea />
//   <OfflineBanner />
//   <ProductionFeedback />
//   <SubmitActions />
// </WrittenProductionExercise>

import { useCallback, useEffect, useRef, useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { ProductionFeedback } from '@/components/exercises/ProductionFeedback'
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

interface Props {
  exercise: WrittenProductionExerciseType
  onResult: (
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: GenericRenderExtras,
  ) => void
}

export function WrittenProductionExercise({ exercise, onResult }: Props) {
  const [text, setText] = useState('')
  const [grading, setGrading] = useState(false)
  const [grade, setGrade] = useState<ProductionGradeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(true)
  const startMs = useRef(Date.now())
  const submitted = useRef(false)

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
        production: trimmed,
        modality: 'written',
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
    <div className="flex w-full flex-col gap-4">
      <ProductionTaskHeader exercise={exercise} title="Write your sentence" />

      {!online && !grade && (
        <OfflineBanner message="You're offline. Connect to submit your sentence for AI feedback." />
      )}

      {!grade && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={grading}
            rows={4}
            placeholder="Type your sentence here…"
            className="w-full resize-none rounded-[var(--radius-md)] border border-border-default bg-surface-raised px-3 py-3 text-base text-fg placeholder:text-fg-subtle focus:border-border-strong focus:outline-none disabled:opacity-50"
          />
          {error && <p className="m-0 text-sm text-error">{error}</p>}
          <PillButton
            variant="primary"
            size="md"
            onClick={() => void handleSubmit()}
            disabled={!text.trim() || grading || !online}
          >
            {grading ? 'Grading…' : 'Submit'}
          </PillButton>
        </>
      )}

      {grade && (
        <>
          <ProductionFeedback grade={grade} />
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

function OfflineBanner({ message }: { message: string }) {
  return (
    <p className="m-0 rounded-[var(--radius-md)] border border-warning-border bg-warning-soft px-3 py-2 text-sm text-warning">
      {message}
    </p>
  )
}
