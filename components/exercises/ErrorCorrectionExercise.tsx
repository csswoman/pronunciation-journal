'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import type { ErrorCorrectionExercise as Exercise } from '@/lib/exercises/types'
import type { PedagogicalFeedback } from '@/lib/practice/types'

export function ErrorCorrectionExercise({ exercise, onResult }: { exercise: Exercise; onResult: (correct: boolean, answer: string, timeMs: number, extras?: { feedback?: PedagogicalFeedback }) => void }) {
  const [answer, setAnswer] = useState('')
  const [done, setDone] = useState(false)
  const submit = () => {
    if (!answer.trim() || done) return
    const normalize = (value: string) => value.trim().toLowerCase().replace(/[.?!]+$/, '').replace(/\s+/g, ' ')
    const correct = normalize(answer) === normalize(exercise.correctSentence)
    setDone(true)
    onResult(correct, answer, 0, { feedback: { immediate: correct ? 'Correcto.' : 'Revisa la corrección.', correction: exercise.correctSentence, explanation: exercise.explanation, canRetry: !correct, errorCode: correct ? undefined : 'form_error' } })
  }
  return (
    <div className="flex flex-col gap-layout-stack-loose">
      <p className="max-w-[65ch] text-body-md leading-relaxed text-fg">Corrige la oración: <strong>{exercise.sentence}</strong></p>
      <input value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={done} aria-label="Oración corregida" className="min-h-12 rounded-md border border-border-default bg-surface-sunken px-4 py-3 text-body-md text-fg focus-ring" />
      <Button type="button" variant="primary" size="lg" fullWidth onClick={submit} disabled={done || !answer.trim()}>Comprobar</Button>
    </div>
  )
}
