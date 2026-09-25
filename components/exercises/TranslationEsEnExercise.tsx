'use client'

// Planned structure:
// <TranslationEsEnExercise>
//   <SourceSpanishCard />
//   <EnglishInputArea />
//   <ErrorAlert />
//   <SubmitButton />
// </TranslationEsEnExercise>

import { useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { useProductionGrading } from '@/hooks/useProductionGrading'
import { pedagogicalFeedbackFromProductionGrade } from '@/lib/exercises/feedback'
import { translationAnswers } from '@/lib/exercises/translation'
import type { TranslationEsEnExercise as Exercise } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'

export function TranslationEsEnExercise({
  exercise,
  onResult,
}: {
  exercise: Exercise
  onResult: (correct: boolean, answer: string, timeMs: number, extras?: GenericRenderExtras) => void
}) {
  const [answer, setAnswer] = useState('')
  const [done, setDone] = useState(false)
  const startedAt = useRef(Date.now())
  const acceptedAnswers = useMemo(() => translationAnswers(exercise), [exercise])
  const grading = useProductionGrading({
    exerciseKey: exercise.id,
    acceptedAnswers,
    fixedReference: true,
    offlineMessage: `Sin conexión. Referencia: ${exercise.referenceEn}`,
  })
  const loading = grading.grading

  async function submit() {
    const text = answer.trim()
    if (!text || loading || done) return
    const grade = await grading.grade({
      targetItem: exercise.referenceEn,
      taskPrompt: `Translate from Spanish to English: ${exercise.sourceEs}`,
      production: text,
      modality: 'written',
    })
    if (!grade) return
    setDone(true)
    onResult(grade.correct, text, Date.now() - startedAt.current, {
      score: grade.score,
      feedback: pedagogicalFeedbackFromProductionGrade(grade),
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="rounded-xl border border-border-default bg-surface-sunken/50 p-5 sm:p-6 text-center">
        <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-subtle">
          Oración en español
        </span>
        <p className="mt-2 text-h3 font-medium leading-relaxed text-fg sm:text-h2">
          {exercise.sourceEs}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="translation-input" className="text-body-sm font-medium text-fg-muted">
          Tu traducción al inglés
        </label>
        <textarea
          id="translation-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey || event.key === 'Enter') && !event.shiftKey && answer.trim() && !loading && !done) {
              event.preventDefault()
              void submit()
            }
          }}
          rows={3}
          disabled={loading || done}
          placeholder="Tradúcelo al inglés…"
          className="w-full resize-none rounded-xl border border-border-default bg-surface-sunken/60 px-4 py-3 text-body-lg leading-relaxed text-fg focus-ring placeholder:text-fg-subtle disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {grading.error ? (
        <p role="alert" className="text-body-sm text-error">
          {grading.error}
        </p>
      ) : null}

      {!done && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!answer.trim() || loading}
          onClick={() => void submit()}
        >
          {loading ? 'Corrigiendo…' : 'Comprobar'}
        </Button>
      )}
    </div>
  )
}
