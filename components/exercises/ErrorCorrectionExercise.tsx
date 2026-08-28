'use client'

// Planned structure:
// <ErrorCorrectionExercise>
//   <SentencePrompt />
//   <CorrectedInput />
//   <SubmitButton />
// </ErrorCorrectionExercise>

import { useState } from 'react'
import Button from '@/components/ui/Button'
import type { ErrorCorrectionExercise as Exercise } from '@/lib/exercises/types'
import type { PedagogicalFeedback } from '@/lib/practice/types'

export function ErrorCorrectionExercise({
  exercise,
  onResult,
}: {
  exercise: Exercise
  onResult: (correct: boolean, answer: string, timeMs: number, extras?: { feedback?: PedagogicalFeedback }) => void
}) {
  const [answer, setAnswer] = useState('')
  const [done, setDone] = useState(false)

  const submit = () => {
    if (!answer.trim() || done) return
    const normalize = (value: string) =>
      value.trim().toLowerCase().replace(/[.?!]+$/, '').replace(/\s+/g, ' ')
    const correct = normalize(answer) === normalize(exercise.correctSentence)
    setDone(true)
    onResult(correct, answer, 0, {
      feedback: {
        immediate: correct ? 'Correcto.' : 'Revisa la corrección.',
        correction: exercise.correctSentence,
        explanation: exercise.explanation,
        canRetry: !correct,
        errorCode: correct ? undefined : 'form_error',
      },
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="rounded-xl border border-border-default bg-surface-sunken/50 p-5 sm:p-6 text-center">
        <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-subtle">
          Oración con error
        </span>
        <p className="mt-2 text-h3 font-medium leading-relaxed text-fg sm:text-h2">
          {exercise.sentence}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="error-correction-input" className="text-body-sm font-medium text-fg-muted">
          Escribe la oración corregida
        </label>
        <input
          id="error-correction-input"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submit()
            }
          }}
          disabled={done}
          placeholder="Escribe la corrección aquí…"
          aria-label="Oración corregida"
          className="min-h-13 rounded-xl border border-border-default bg-surface-sunken/60 px-4 py-3 text-body-lg text-fg focus-ring placeholder:text-fg-subtle"
        />
      </div>

      {!done && (
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          onClick={submit}
          disabled={!answer.trim()}
        >
          Comprobar
        </Button>
      )}
    </div>
  )
}
