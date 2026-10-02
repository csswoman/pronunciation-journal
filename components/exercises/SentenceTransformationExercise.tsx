'use client'

// Planned structure:
// <SentenceTransformationExercise>
//   <SourceSentenceCard />
//   <Instruction />
//   <AnswerField />
//   <ErrorAlert />
//   <SelfAssessSection />
//   <SubmitButton />
// </SentenceTransformationExercise>

import { useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import { useProductionGrading } from '@/hooks/useProductionGrading'
import { pedagogicalFeedbackFromProductionGrade } from '@/lib/exercises/feedback'
import { transformationAnswers } from '@/lib/exercises/transformations'
import { buildTransformationTaskPrompt } from '@/lib/ai-prompts'
import { matchAnswer, specFromTransformation } from '@/lib/exercises/answer-match'
import { feedbackFromVerdict } from '@/lib/exercises/answer-feedback'
import { checkStructures, STRUCTURE_CHECKS } from '@/lib/exercises/structure-checks'
import { saveAcceptedAnswer, useAcceptedAnswers } from '@/hooks/useAcceptedAnswers'
import { SelfAssessPrompt } from './SelfAssessPrompt'
import type { SentenceTransformationExercise as Exercise } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'
import type { PedagogicalFeedback } from '@/lib/practice/types'

// "Rewrite using enough." / "Usa wish" → "enough" / "wish"; null when the format is free text.
const TARGET_PATTERN = /^(?:rewrite using|reescribe usando|reescríbela usando|usa|use)\s+(.+?)[.:]?$/i

function extractTransformationTarget(instruction: string): string | null {
  return instruction.trim().match(TARGET_PATTERN)?.[1] ?? null
}

export function SentenceTransformationExercise({
  exercise,
  onResult,
}: {
  exercise: Exercise
  onResult: (correct: boolean, answer: string, timeMs: number, extras?: GenericRenderExtras) => void
}) {
  const [answer, setAnswer] = useState('')
  const [done, setDone] = useState(false)
  const [localFeedback, setLocalFeedback] = useState<PedagogicalFeedback | null>(null)
  const [showSelfAssess, setShowSelfAssess] = useState(false)
  const startedAt = useRef(Date.now())

  const auth = useAuthOptional()
  const userId = auth?.user?.id ?? 'anon'
  const extraAccepted = useAcceptedAnswers(exercise.id, userId)

  const acceptedAnswers = useMemo(() => transformationAnswers(exercise), [exercise])
  const pipeline = useProductionGrading({
    exerciseKey: exercise.id,
    acceptedAnswers,
    sourceSentence: exercise.sourceSentence,
    fixedReference: true,
    offlineMessage: acceptedAnswers.length > 0
      ? `Sin conexión. Respuesta de referencia: ${acceptedAnswers[0]}`
      : 'Necesitas conexión para corregir esta transformación.',
  })
  const grading = pipeline.grading
  const canonical = exercise.referenceAnswer ?? acceptedAnswers[0] ?? ''
  const target = useMemo(() => extractTransformationTarget(exercise.instruction), [exercise.instruction])

  async function submit() {
    const production = answer.trim()
    if (!production || grading || done) return
    const timeMs = Date.now() - startedAt.current

    // Local-first matchAnswer
    const spec = exercise.answerSpec ?? specFromTransformation(exercise)
    const maxTypos = exercise.level === 'B2' || exercise.level === 'C1' ? 1 : 2
    const verdict = matchAnswer(production, spec, { maxTypos, extraAccepted })

    if (verdict.kind === 'exact' || verdict.kind === 'variant' || verdict.kind === 'typo') {
      const fb = feedbackFromVerdict(verdict, { canonical, explanation: exercise.instruction })
      setDone(true)
      setLocalFeedback(fb)
      onResult(true, production, timeMs, {
        score: verdict.score,
        feedback: fb,
      })
      return
    }

    if (
      verdict.kind === 'contraction_mismatch' ||
      verdict.kind === 'missing_required' ||
      verdict.kind === 'known_wrong'
    ) {
      const fb = feedbackFromVerdict(verdict, { canonical, explanation: exercise.instruction })
      setLocalFeedback(fb)
      return
    }

    // Check local structures if exercise.requires exists
    if (exercise.requires && exercise.requires.length > 0) {
      const structRes = checkStructures(production, exercise.requires)
      if (!structRes.ok && structRes.missing.length > 0) {
        const firstMissing = structRes.missing[0]
        const checker = STRUCTURE_CHECKS[firstMissing]
        const hint = checker?.hintEs ?? `Falta usar la estructura requerida: ${firstMissing}`
        setLocalFeedback({
          immediate: hint,
          explanation: exercise.instruction,
          canRetry: true,
        })
        return
      }
    }

    // If offline or AI budget spent, offer self-assessment
    if (pipeline.aiBudgetSpent) {
      setShowSelfAssess(true)
      return
    }

    const grade = await pipeline.grade({
      targetItem: exercise.referenceAnswer ?? exercise.instruction,
      taskPrompt: buildTransformationTaskPrompt(exercise),
      production,
      modality: 'written',
      constraintCheck: exercise.instruction,
      level: exercise.level,
    })

    if (!grade) {
      setShowSelfAssess(true)
      return
    }

    const feedback = pedagogicalFeedbackFromProductionGrade(grade)
    feedback.immediate = grade.correct ? '¡Correcto!' : 'Revisa la transformación.'
    if (canonical) {
      feedback.expectedAnswer = canonical
      if (!grade.correct) {
        feedback.correction = canonical
      }
    }

    setDone(true)
    onResult(grade.correct, production, timeMs, {
      score: grade.score,
      feedback,
    })
  }

  const handleSelfMistake = () => {
    setDone(true)
    setShowSelfAssess(false)
    const timeMs = Date.now() - startedAt.current
    onResult(false, answer.trim(), timeMs, {
      score: 0,
      resultStatus: 'answered',
      feedback: {
        immediate: 'Revisa la transformación. Compara tu versión con la de referencia.',
        correction: canonical,
        expectedAnswer: canonical,
        canRetry: false,
      },
      firstTryFailed: true,
    })
  }

  const handleSelfApprove = async () => {
    setDone(true)
    setShowSelfAssess(false)
    const production = answer.trim()
    const timeMs = Date.now() - startedAt.current
    await saveAcceptedAnswer({
      userId,
      exerciseKey: exercise.id,
      answer: production,
      canonical,
    })
    onResult(true, production, timeMs, {
      score: 70,
      resultStatus: 'unscored',
      feedback: {
        immediate: '¡Respuesta aceptada por ti!',
        correction: canonical,
        expectedAnswer: canonical,
        canRetry: false,
      },
    })
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 rounded-3xl bg-sky px-8 py-7 text-ink">
        <span className="text-caption font-bold uppercase tracking-[0.18em] text-ink/80">
          Oración original
        </span>
        <p className="m-0 font-display text-h3 font-bold leading-snug text-balance sm:text-h2">
          {exercise.sourceSentence}
        </p>
      </div>

      <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2 text-body-md leading-relaxed text-fg-muted">
        {target ? (
          <>
            <span className="font-bold text-fg">Reescríbela usando</span>
            <span className="rounded-full bg-ink px-4 py-1.5 text-body-md font-bold text-on-accent">
              {target}
            </span>
            <span>sin cambiar el significado.</span>
          </>
        ) : (
          exercise.instruction
        )}
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="transformation-instruction" className="text-body-sm font-bold text-fg">
          Tu oración
        </label>
        <textarea
          id="transformation-instruction"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (
              (event.metaKey || event.ctrlKey || event.key === 'Enter') &&
              !event.shiftKey &&
              answer.trim() &&
              !grading &&
              !done
            ) {
              event.preventDefault()
              void submit()
            }
          }}
          rows={3}
          disabled={grading || done}
          placeholder="Escribe la forma correcta…"
          className="min-h-36 w-full resize-none rounded-2xl border-2 border-primary bg-field px-5 py-4 text-body-lg leading-relaxed text-fg focus-ring placeholder:text-fg-muted disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
        />
      </div>

      {localFeedback?.immediate && !done ? (
        <p role="alert" className="text-body-sm text-error font-medium">
          {localFeedback.immediate}
        </p>
      ) : null}

      {pipeline.error ? (
        <p role="alert" className="text-body-sm text-error font-medium">
          {pipeline.error}
        </p>
      ) : null}

      {showSelfAssess && !done && (
        <SelfAssessPrompt
          canonicalAnswer={canonical}
          userAnswer={answer.trim()}
          onMistake={handleSelfMistake}
          onSelfApprove={handleSelfApprove}
        />
      )}

      {!done && (
        <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
          <Button
            variant="primary"
            size="lg"
            className="rounded-full px-8 font-bold"
            onClick={() => void submit()}
            disabled={!answer.trim() || grading}
          >
            <span>{grading ? 'Corrigiendo…' : 'Comprobar'}</span>
            <span className="hidden rounded-md bg-white/25 px-2 py-0.5 text-tiny font-bold text-on-accent sm:inline-flex" aria-hidden>
              Enter
            </span>
          </Button>
        </div>
      )}
    </div>
  )
}
