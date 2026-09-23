'use client'

// Planned structure:
// <FocusExerciseRunner>
//   <ExerciseProgress />
//   <GenericExerciseView /> | <ExerciseResult />
// </FocusExerciseRunner>

import { useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { GenericExerciseView } from '@/components/practice/session/GenericExerciseView'
import { fromGenericExercise } from '@/lib/practice/adapters'
import { buildExerciseResult } from '@/components/practice/session/session-state-helpers'
import type { FocusContent } from '@/lib/focus/types'
import type { ExerciseResult, PracticeSubmitHandler } from '@/lib/practice/types'

export function FocusExerciseRunner({ content, onResult, onComplete, onRestart }: {
  content: FocusContent
  onResult: (result: ExerciseResult) => void
  onComplete: (results: ExerciseResult[]) => void
  onRestart: () => void
}) {
  const exercises = useMemo(() => content.exercises.map((exercise) => fromGenericExercise(exercise, 'practice')), [content])
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<Array<boolean | null>>([])
  const resultRows = useRef<ExerciseResult[]>([])
  const startedAt = useRef(Date.now())

  const onSubmit: PracticeSubmitHandler = (correct, answer, extras) => {
    const exercise = exercises[index]
    if (!exercise) return
    const result = buildExerciseResult({
      current: exercise,
      isCorrect: correct,
      userAnswer: answer,
      timeMs: Date.now() - startedAt.current,
      context: 'practice',
      extras,
    })
    const answered = result.status === 'answered'
    setResults((previous) => [...previous, answered ? correct : null])
    const nextRows = [...resultRows.current, result]
    resultRows.current = nextRows
    onResult(result)
    if (index === exercises.length - 1) onComplete(nextRows)
    startedAt.current = Date.now()
    setIndex((previous) => previous + 1)
  }

  if (exercises.length === 0) {
    return <p className="text-body-sm text-fg-muted">Este contenido no incluye ejercicios interactivos. Puedes repasar el material de arriba.</p>
  }

  if (index >= exercises.length) {
    const answered = results.filter((result) => result !== null).length
    const correct = results.filter((result) => result === true).length
    return (
      <div className="rounded-3xl border border-border-default bg-surface-raised p-6" role="status">
        <h3 className="font-display text-h3 text-fg">Práctica terminada</h3>
        <p className="mt-2 text-body text-fg-muted">{correct} de {answered} respuestas correctas{results.length > answered ? ` · ${results.length - answered} omitidas` : ''}.</p>
        {answered > 0 && <p className="mt-2 text-body font-semibold text-fg">Puntuación: {Math.round(correct / answered * 100)} %</p>}
        <Button className="mt-5" variant="secondary" onClick={() => { resultRows.current = []; startedAt.current = Date.now(); onRestart(); setIndex(0); setResults([]) }}>Repetir ejercicios</Button>
      </div>
    )
  }

  const exercise = exercises[index]
  if (exercise.payload.kind !== 'generic') return null
  return (
    <div>
      <p className="mb-4 font-kicker text-fg-muted">Ejercicio {index + 1} de {exercises.length}</p>
      <GenericExerciseView key={exercise.id} exercise={{ ...exercise, payload: exercise.payload }} onSubmit={onSubmit} />
    </div>
  )
}
