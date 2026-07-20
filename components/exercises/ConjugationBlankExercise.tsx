'use client'
import { useState } from 'react'
import type { ConjugationBlankExercise as Exercise } from '@/lib/exercises/types'
import type { PedagogicalFeedback } from '@/lib/practice/types'

const normalize = (value: string) => value.trim().toLowerCase().replace(/[’']/g, "'")
export function ConjugationBlankExercise({ exercise, onResult }: { exercise: Exercise; onResult: (correct: boolean, answer: string, timeMs: number, extras?: { feedback?: PedagogicalFeedback }) => void }) {
 const [answer, setAnswer] = useState(''); const [done, setDone] = useState(false)
 const submit = () => { const accepted = [exercise.answer, ...(exercise.acceptedAnswers ?? [])].map(normalize); const correct = accepted.includes(normalize(answer)); setDone(true); onResult(correct, answer, 0, { feedback: { immediate: correct ? 'Correcto.' : 'Revisa la forma verbal.', expectedAnswer: exercise.answer, tip: exercise.hint, errorCode: correct ? 'correct' : 'form_error', canRetry: !correct, nextAction: correct ? 'continue' : 'retry' } }) }
 return <div className="flex flex-col gap-3"><p className="text-fg">{exercise.sentence}</p><input aria-label="Verb form" value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={done} className="rounded-lg border border-border-default bg-surface-raised p-3 text-fg" /><button type="button" disabled={done || !answer.trim()} onClick={submit} className="self-start rounded-lg bg-primary px-4 py-2 text-on-primary disabled:opacity-50">Comprobar</button></div>
}
