'use client'

import { useState } from 'react'
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
  return <div className="flex flex-col gap-3"><p className="text-fg">Corrige la oración: <strong>{exercise.sentence}</strong></p><input value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={done} aria-label="Corrected sentence" className="rounded-lg border border-border-default bg-surface-raised p-3 text-fg" /><button type="button" onClick={submit} disabled={done || !answer.trim()} className="self-start rounded-lg bg-primary px-4 py-2 text-on-primary disabled:opacity-50">Comprobar</button></div>
}
