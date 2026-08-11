'use client'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import type { ConjugationBlankExercise as Exercise } from '@/lib/exercises/types'
import type { PedagogicalFeedback } from '@/lib/practice/types'

const normalize = (value: string) => value.trim().toLowerCase().replace(/[’']/g, "'")
export function ConjugationBlankExercise({ exercise, onResult }: { exercise: Exercise; onResult: (correct: boolean, answer: string, timeMs: number, extras?: { feedback?: PedagogicalFeedback }) => void }) {
 const [answer, setAnswer] = useState(''); const [done, setDone] = useState(false)
 const submit = () => { const accepted = [exercise.answer, ...(exercise.acceptedAnswers ?? [])].map(normalize); const correct = accepted.includes(normalize(answer)); setDone(true); onResult(correct, answer, 0, { feedback: { immediate: correct ? 'Correcto.' : 'Revisa la forma verbal.', expectedAnswer: exercise.answer, tip: exercise.hint, errorCode: correct ? 'correct' : 'form_error', canRetry: !correct, nextAction: correct ? 'continue' : 'retry' } }) }
 return (
  <div className="flex flex-col gap-layout-stack-loose">
   <p className="max-w-[65ch] text-body-md leading-relaxed text-fg">{exercise.sentence}</p>
   <input aria-label="Forma verbal" value={answer} onChange={(e) => setAnswer(e.target.value)} disabled={done} className="min-h-12 rounded-md border border-border-default bg-surface-sunken px-4 py-3 text-body-md text-fg focus-ring" />
   <Button type="button" variant="primary" size="lg" fullWidth disabled={done || !answer.trim()} onClick={submit}>Comprobar</Button>
  </div>
 )
}
