'use client'

// Planned structure:
// <SentenceTransformationExercise>
//   <SourceSentenceCard />
//   <Instruction />
//   <AnswerField />
//   <ErrorAlert />
//   <SubmitButton />
// </SentenceTransformationExercise>

import { useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { gradeProduction, ProductionGradeError } from '@/lib/exercises/grade-production-client'
import { pedagogicalFeedbackFromProductionGrade } from '@/lib/exercises/feedback'
import { isExactTransformation } from '@/lib/exercises/transformations'
import type { SentenceTransformationExercise as Exercise } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'

export function SentenceTransformationExercise({
  exercise,
  onResult,
}: {
  exercise: Exercise
  onResult: (correct: boolean, answer: string, timeMs: number, extras?: GenericRenderExtras) => void
}) {
  const [answer, setAnswer] = useState('')
  const [grading, setGrading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedAt = useRef(Date.now())

  async function submit() {
    const production = answer.trim()
    if (!production || grading || done) return

    if (isExactTransformation(exercise, production)) {
      setDone(true)
      return onResult(true, production, Date.now() - startedAt.current, {
        score: 100,
        feedback: {
          immediate: '¡Correcto!',
          expectedAnswer: exercise.referenceAnswer,
          errorCode: 'correct',
          canRetry: false,
          nextAction: 'continue',
        },
      })
    }

    if (!navigator.onLine) {
      if (exercise.referenceAnswer) {
        return setError(`Sin conexión. Respuesta de referencia: ${exercise.referenceAnswer}`)
      }
      return setError('Necesitas conexión para corregir esta transformación.')
    }

    setGrading(true)
    setError(null)
    try {
      const targetItem = exercise.referenceAnswer ?? exercise.instruction
      const taskPrompt = exercise.referenceAnswer
        ? `Transform the original sentence according to the instruction. Original sentence: "${exercise.sourceSentence}". Instruction: "${exercise.instruction}". Reference solution: "${exercise.referenceAnswer}".`
        : `Transform the original sentence according to the instruction. Original sentence: "${exercise.sourceSentence}". Instruction: "${exercise.instruction}".`

      const grade = await gradeProduction({
        targetItem,
        taskPrompt,
        production,
        modality: 'written',
        constraintCheck: exercise.instruction,
      })

      const feedback = pedagogicalFeedbackFromProductionGrade(grade)
      feedback.immediate = grade.correct ? '¡Correcto!' : 'Revisa la transformación.'
      if (exercise.referenceAnswer) {
        feedback.expectedAnswer = exercise.referenceAnswer
        if (!grade.correct) {
          feedback.correction = exercise.referenceAnswer
        }
      }

      setDone(true)
      onResult(grade.correct, production, Date.now() - startedAt.current, {
        score: grade.score,
        feedback,
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
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey || event.key === 'Enter') && !event.shiftKey && answer.trim() && !grading && !done) {
              event.preventDefault()
              void submit()
            }
          }}
          rows={3}
          disabled={grading || done}
          placeholder="Escribe la nueva oración…"
          className="w-full resize-none rounded-xl border border-border-default bg-surface-sunken/60 px-4 py-3 text-body-lg leading-relaxed text-fg focus-ring placeholder:text-fg-subtle disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {error ? (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      ) : null}

      {!done && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => void submit()}
          disabled={!answer.trim() || grading}
        >
          {grading ? 'Corrigiendo…' : 'Comprobar'}
        </Button>
      )}
    </div>
  )
}
