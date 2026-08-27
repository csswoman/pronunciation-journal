'use client'

// Planned structure:
// <SentenceTransformationExercise>
//   <SourceSentenceCard />
//   <Instruction />
//   <AnswerField />
//   <ErrorAlert />
//   <SubmitButton />
//   <SkipButton />
// </SentenceTransformationExercise>

import { useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { gradeProduction, ProductionGradeError } from '@/lib/exercises/grade-production-client'
import { pedagogicalFeedbackFromProductionGrade } from '@/lib/exercises/feedback'
import type { SentenceTransformationExercise as Exercise } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'

export function SentenceTransformationExercise({
  exercise,
  onResult,
  onSkip,
}: {
  exercise: Exercise
  onResult: (correct: boolean, answer: string, timeMs: number, extras?: GenericRenderExtras) => void
  onSkip?: () => void
}) {
  const [answer, setAnswer] = useState('')
  const [grading, setGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedAt = useRef(Date.now())

  async function submit() {
    const production = answer.trim()
    if (!production || grading || !navigator.onLine) {
      if (!navigator.onLine) setError('Necesitas conexión para corregir esta transformación.')
      return
    }
    setGrading(true)
    setError(null)
    try {
      const grade = await gradeProduction({
        targetItem: exercise.instruction,
        taskPrompt: `Transform this sentence. Source: ${exercise.sourceSentence}. Instruction: ${exercise.instruction}`,
        production,
        modality: 'written',
      })
      onResult(grade.correct, production, Date.now() - startedAt.current, {
        score: grade.score,
        feedback: pedagogicalFeedbackFromProductionGrade(grade),
      })
    } catch (cause) {
      setError(cause instanceof ProductionGradeError ? cause.message : 'No se pudo corregir. Inténtalo de nuevo.')
    } finally {
      setGrading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="rounded-xl border border-border-default bg-surface-sunken/50 p-5">
        <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-subtle">
          Oración original
        </span>
        <p className="mt-1.5 text-h3 font-medium leading-relaxed text-fg sm:text-h2">
          {exercise.sourceSentence}
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <label htmlFor="transformation-instruction" className="text-body-sm font-semibold text-fg">
          Instrucción: <span className="font-normal text-fg-muted">{exercise.instruction}</span>
        </label>
        <textarea
          id="transformation-instruction"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          rows={3}
          disabled={grading}
          placeholder="Escribe la nueva oración…"
          className="w-full resize-none rounded-xl border border-border-default bg-surface-sunken/60 px-4 py-3 text-body-lg leading-relaxed text-fg focus-ring placeholder:text-fg-subtle"
        />
      </div>

      {error ? (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      ) : null}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={() => void submit()}
        disabled={!answer.trim() || grading}
      >
        {grading ? 'Corrigiendo…' : 'Comprobar'}
      </Button>

      {onSkip ? (
        <button
          type="button"
          onClick={onSkip}
          className="self-center py-2 text-center text-body-sm font-medium text-fg-subtle transition-colors hover:text-fg focus-ring rounded-md px-3 cursor-pointer"
        >
          Omitir este ejercicio
        </button>
      ) : null}
    </div>
  )
}
