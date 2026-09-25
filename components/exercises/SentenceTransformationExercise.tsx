'use client'

// Planned structure:
// <SentenceTransformationExercise>
//   <SourceSentenceCard />
//   <Instruction />
//   <AnswerField />
//   <ErrorAlert />
//   <SubmitButton />
// </SentenceTransformationExercise>

import { useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { useProductionGrading } from '@/hooks/useProductionGrading'
import { pedagogicalFeedbackFromProductionGrade } from '@/lib/exercises/feedback'
import { transformationAnswers } from '@/lib/exercises/transformations'
import { buildTransformationTaskPrompt } from '@/lib/ai-prompts'
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
  const [done, setDone] = useState(false)
  const startedAt = useRef(Date.now())
  const acceptedAnswers = useMemo(() => transformationAnswers(exercise), [exercise])
  const pipeline = useProductionGrading({
    exerciseKey: exercise.id,
    acceptedAnswers,
    sourceSentence: exercise.sourceSentence,
    fixedReference: true,
    offlineMessage: acceptedAnswers.length > 0
      ? `Sin conexión. Respuesta de referencia: ${acceptedAnswers[0]}`
      : 'Necesitas conexión para corregir esta transformación.',
  })
  const grading = pipeline.grading

  async function submit() {
    const production = answer.trim()
    if (!production || grading || done) return

    const grade = await pipeline.grade({
      targetItem: exercise.referenceAnswer ?? exercise.instruction,
      taskPrompt: buildTransformationTaskPrompt(exercise),
      production,
      modality: 'written',
      constraintCheck: exercise.instruction,
    })
    if (!grade) return

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

      {pipeline.error ? (
        <p role="alert" className="text-body-sm text-error">
          {pipeline.error}
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
