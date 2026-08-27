'use client'

// Planned structure:
// <ConjugationBlankExercise>
//   <SentencePrompt />
//   <VerbLemmaHint />
//   <AnswerInput />
//   <SubmitButton />
// </ConjugationBlankExercise>

import { useState } from 'react'
import Button from '@/components/ui/Button'
import type { ConjugationBlankExercise as Exercise } from '@/lib/exercises/types'
import type { PedagogicalFeedback } from '@/lib/practice/types'

const normalize = (value: string) => value.trim().toLowerCase().replace(/[’']/g, "'")

export function ConjugationBlankExercise({
  exercise,
  onResult,
}: {
  exercise: Exercise
  onResult: (correct: boolean, answer: string, timeMs: number, extras?: { feedback?: PedagogicalFeedback }) => void
}) {
  const [answer, setAnswer] = useState('')
  const [done, setDone] = useState(false)

  const submit = () => {
    const accepted = [exercise.answer, ...(exercise.acceptedAnswers ?? [])].map(normalize)
    const correct = accepted.includes(normalize(answer))
    setDone(true)
    onResult(correct, answer, 0, {
      feedback: {
        immediate: correct ? 'Correcto.' : 'Revisa la forma verbal.',
        expectedAnswer: exercise.answer,
        tip: exercise.hint,
        errorCode: correct ? 'correct' : 'form_error',
        canRetry: !correct,
        nextAction: correct ? 'continue' : 'retry',
      },
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="rounded-xl border border-border-default bg-surface-sunken/50 p-5 sm:p-6 text-center">
        <p className="text-h3 font-medium leading-relaxed text-fg sm:text-h2">{exercise.sentence}</p>
        {exercise.lemma ? (
          <p className="mt-3 text-caption text-fg-muted">
            Verbo en infinitivo: <strong className="font-mono font-semibold text-primary">{exercise.lemma}</strong>
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="conjugation-input" className="text-body-sm font-medium text-fg-muted">
          Forma verbal conjugada
        </label>
        <input
          id="conjugation-input"
          aria-label="Forma verbal"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              if (answer.trim() && !done) submit()
            }
          }}
          disabled={done}
          placeholder="Escribe la forma verbal…"
          className="min-h-13 rounded-xl border border-border-default bg-surface-sunken/60 px-4 py-3 text-body-lg text-fg focus-ring placeholder:text-fg-subtle"
        />
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        disabled={done || !answer.trim()}
        onClick={submit}
      >
        Comprobar
      </Button>
    </div>
  )
}
