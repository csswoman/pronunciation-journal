'use client'

// Planned structure:
// <TranslationEsEnExercise>
//   <TaskTitle> + <HintToggle />
//   <SourceSpanishCard />
//   <HintExample /> (optional)
//   <EnglishInputArea />
//   <ErrorAlert />
//   <SubmitFooter /> (skip + check)
// </TranslationEsEnExercise>

import { useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { useProductionGrading } from '@/hooks/useProductionGrading'
import { pedagogicalFeedbackFromProductionGrade } from '@/lib/exercises/feedback'
import { translationAnswers } from '@/lib/exercises/translation'
import type { TranslationEsEnExercise as Exercise } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'
import { HintToggle, SubmitFooter } from './written-production/WrittenProductionParts'

export function TranslationEsEnExercise({
  exercise,
  onResult,
}: {
  exercise: Exercise
  onResult: (correct: boolean, answer: string, timeMs: number, extras?: GenericRenderExtras) => void
}) {
  const [answer, setAnswer] = useState('')
  const [done, setDone] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
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
    <div className="flex w-full flex-col gap-5 sm:gap-6" aria-busy={loading || undefined}>
      <div className="relative flex flex-col items-center gap-2 rounded-3xl bg-sky p-6 text-center text-ink sm:p-8">
        <span className="text-caption font-semibold uppercase tracking-widest text-ink/70">
          Oración en español
        </span>
        <p className="m-0 font-display text-h3 font-bold leading-snug text-balance sm:text-h2">
          {exercise.sourceEs}
        </p>
        {!done && (
          <div className="absolute right-3 top-3">
            <HintToggle open={hintOpen} onToggle={() => setHintOpen((v) => !v)} />
          </div>
        )}
      </div>

      {hintOpen && (
        <p className="m-0 rounded-2xl bg-butter-soft p-4 text-body-sm text-ink">
          <span className="font-semibold">Ejemplo: </span>
          <span className="italic">{exercise.referenceEn}</span>
        </p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="translation-input" className="text-body-sm font-bold text-fg">
          Tu traducción al inglés
        </label>
        <textarea
          id="translation-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && answer.trim() && !loading && !done) {
              event.preventDefault()
              void submit()
            }
          }}
          rows={3}
          disabled={loading || done}
          placeholder="Escribe la traducción en inglés…"
          aria-invalid={grading.error ? true : undefined}
          className={cn(
            'min-h-36 w-full resize-none rounded-3xl border-2 border-primary bg-surface-sunken px-5 py-4 text-body-lg leading-relaxed text-fg placeholder:text-fg-muted focus-ring',
            'transition-colors duration-150 ease-out-quart disabled:cursor-not-allowed disabled:opacity-50',
            grading.error && 'border-error-border',
          )}
        />
      </div>

      {grading.error ? (
        <p
          role="alert"
          className="m-0 rounded-md border border-error-border bg-error-soft p-3.5 text-body-sm font-medium text-error"
        >
          {grading.error}
        </p>
      ) : null}

      {!done && (
        <SubmitFooter
          grading={loading}
          disabled={!answer.trim() || loading}
          onSubmit={() => void submit()}
          submitLabel="Comprobar"
        />
      )}
    </div>
  )
}
