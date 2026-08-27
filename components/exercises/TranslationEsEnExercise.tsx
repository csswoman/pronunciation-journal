'use client'

// Planned structure:
// <TranslationEsEnExercise>
//   <SourceSpanishCard />
//   <EnglishInputArea />
//   <ErrorAlert />
//   <SubmitButton />
// </TranslationEsEnExercise>

import { useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { gradeProduction } from '@/lib/exercises/grade-production-client'
import { pedagogicalFeedbackFromProductionGrade } from '@/lib/exercises/feedback'
import { isExactTranslation } from '@/lib/exercises/translation'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedAt = useRef(Date.now())

  async function submit() {
    const text = answer.trim()
    if (!text || loading) return
    if (isExactTranslation(exercise, text)) {
      return onResult(true, text, Date.now() - startedAt.current, { score: 100 })
    }
    if (!navigator.onLine) {
      return setError(`Sin conexión. Referencia: ${exercise.referenceEn}`)
    }
    setLoading(true)
    setError(null)
    try {
      const grade = await gradeProduction({
        targetItem: exercise.referenceEn,
        taskPrompt: `Translate from Spanish to English: ${exercise.sourceEs}`,
        production: text,
        modality: 'written',
      })
      onResult(grade.correct, text, Date.now() - startedAt.current, {
        score: grade.score,
        feedback: pedagogicalFeedbackFromProductionGrade(grade),
      })
    } catch {
      setError('No se pudo corregir. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
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
          rows={3}
          placeholder="Tradúcelo al inglés…"
          className="w-full resize-none rounded-xl border border-border-default bg-surface-sunken/60 px-4 py-3 text-body-lg leading-relaxed text-fg focus-ring placeholder:text-fg-subtle"
        />
      </div>

      {error ? (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      ) : null}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!answer.trim() || loading}
        onClick={() => void submit()}
      >
        {loading ? 'Corrigiendo…' : 'Comprobar'}
      </Button>
    </div>
  )
}
