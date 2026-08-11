'use client'

import { useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { gradeProduction, ProductionGradeError } from '@/lib/exercises/grade-production-client'
import { pedagogicalFeedbackFromProductionGrade } from '@/lib/exercises/feedback'
import type { SentenceTransformationExercise as Exercise } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'

export function SentenceTransformationExercise({ exercise, onResult, onSkip }: { exercise: Exercise; onResult: (correct: boolean, answer: string, timeMs: number, extras?: GenericRenderExtras) => void; onSkip?: () => void }) {
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
      onResult(grade.correct, production, Date.now() - startedAt.current, { score: grade.score, feedback: pedagogicalFeedbackFromProductionGrade(grade) })
    } catch (cause) {
      setError(cause instanceof ProductionGradeError ? cause.message : 'No se pudo corregir. Inténtalo de nuevo.')
    } finally {
      setGrading(false)
    }
  }

  return <div className="flex flex-col gap-4">
    <p className="rounded-md border border-border-default bg-surface-sunken px-4 py-3 text-body-md leading-relaxed text-fg">{exercise.sourceSentence}</p>
    <p className="max-w-[65ch] text-body-md font-medium leading-relaxed text-fg">{exercise.instruction}</p>
    <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={3} disabled={grading} placeholder="Escribe la nueva oración…" className="w-full rounded-md border border-border-default bg-surface-sunken px-4 py-3 text-body-md leading-relaxed text-fg focus-ring" />
    {error ? <p role="alert" className="text-body-sm text-error">{error}</p> : null}
    <Button variant="primary" size="lg" fullWidth onClick={() => void submit()} disabled={!answer.trim() || grading}>{grading ? 'Corrigiendo…' : 'Corregir'}</Button>
    {onSkip ? <button type="button" onClick={onSkip} className="self-center text-body-sm text-fg-muted focus-ring">Omitir este</button> : null}
  </div>
}
