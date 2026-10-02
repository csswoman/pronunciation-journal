'use client'

// Planned structure:
// <ErrorCorrectionExercise>
//   <SentencePrompt />
//   <CorrectedInput />
//   <ActionButtons />
//     <AlreadyCorrectButton />
//     <SubmitButton />
//   <SelfAssessSection />
// </ErrorCorrectionExercise>

import { useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import { matchAnswer, normalize, specFromErrorCorrection } from '@/lib/exercises/answer-match'
import { feedbackFromVerdict } from '@/lib/exercises/answer-feedback'
import { useDrillAttempts } from '@/hooks/useDrillAttempts'
import { saveAcceptedAnswer, useAcceptedAnswers } from '@/hooks/useAcceptedAnswers'
import { SelfAssessPrompt } from './SelfAssessPrompt'
import type { ErrorCorrectionExercise as Exercise } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'
import type { PedagogicalFeedback } from '@/lib/practice/types'

export function ErrorCorrectionExercise({
  exercise,
  onResult,
}: {
  exercise: Exercise
  onResult: (correct: boolean, answer: string, timeMs: number, extras?: GenericRenderExtras) => void
}) {
  const [answer, setAnswer] = useState('')
  const [done, setDone] = useState(false)
  const [feedback, setFeedback] = useState<PedagogicalFeedback | null>(null)
  const [showSelfAssess, setShowSelfAssess] = useState(false)
  const startedAt = useRef(Date.now())

  const auth = useAuthOptional()
  const userId = auth?.user?.id ?? 'anon'
  const extraAccepted = useAcceptedAnswers(exercise.id, userId)
  const attempts = useDrillAttempts({ level: exercise.level })

  const showAlreadyCorrectBtn =
    !done &&
    !showSelfAssess &&
    (exercise.alreadyCorrect === true ||
      (Boolean(exercise.level) && exercise.level !== 'A1' && exercise.sourceRef?.source === 'grammar_deck'))

  const handleAlreadyCorrect = () => {
    if (done) return
    const timeMs = Date.now() - startedAt.current
    if (exercise.alreadyCorrect) {
      setDone(true)
      onResult(true, exercise.sentence, timeMs, {
        score: 100,
        feedback: {
          immediate: '¡Correcto! Esta oración ya era correcta.',
          canRetry: false,
        },
        firstTryFailed: attempts.firstTryFailed,
      })
    } else {
      const { revealed } = attempts.recordFailure()
      if (revealed) {
        setShowSelfAssess(true)
      } else {
        setFeedback({
          immediate: 'Esta oración sí tiene un error. Intenta encontrarlo y corregirlo.',
          canRetry: true,
        })
      }
    }
  }

  const submit = () => {
    const production = answer.trim()
    if (!production || done) return
    const timeMs = Date.now() - startedAt.current

    if (exercise.alreadyCorrect) {
      const matchesOriginal = normalize(production) === normalize(exercise.sentence)
      if (matchesOriginal) {
        setDone(true)
        onResult(true, production, timeMs, {
          score: 100,
          feedback: {
            immediate: '¡Correcto! La oración ya era correcta.',
            canRetry: false,
          },
          firstTryFailed: attempts.firstTryFailed,
        })
        return
      }
    }

    const spec = exercise.answerSpec ?? specFromErrorCorrection(exercise)
    const maxTypos = exercise.level === 'B2' || exercise.level === 'C1' ? 1 : 2
    const verdict = matchAnswer(production, spec, { maxTypos, extraAccepted })

    if (verdict.kind === 'exact' || verdict.kind === 'variant' || verdict.kind === 'typo') {
      setDone(true)
      const fb = feedbackFromVerdict(verdict, {
        canonical: exercise.correctSentence,
        explanation: exercise.explanation,
      })
      setFeedback(fb)
      onResult(true, production, timeMs, {
        score: verdict.score,
        feedback: fb,
        firstTryFailed: attempts.firstTryFailed,
      })
      return
    }

    if (
      verdict.kind === 'contraction_mismatch' ||
      verdict.kind === 'missing_required' ||
      verdict.kind === 'known_wrong'
    ) {
      const fb = feedbackFromVerdict(verdict, {
        canonical: exercise.correctSentence,
        explanation: exercise.explanation,
      })
      setFeedback(fb)
      return
    }

    const { revealed } = attempts.recordFailure()
    const fb = feedbackFromVerdict(verdict, {
      canonical: exercise.correctSentence,
      explanation: exercise.explanation,
    })
    setFeedback(fb)

    if (revealed) {
      setShowSelfAssess(true)
    }
  }

  const handleSelfMistake = () => {
    setDone(true)
    setShowSelfAssess(false)
    const timeMs = Date.now() - startedAt.current
    onResult(false, answer.trim(), timeMs, {
      score: 0,
      resultStatus: 'answered',
      feedback: feedback ?? {
        immediate: 'Esa no es la corrección. Compara tu versión con la correcta.',
        correction: exercise.correctSentence,
        explanation: exercise.explanation,
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
      canonical: exercise.correctSentence,
    })
    onResult(true, production, timeMs, {
      score: 70,
      resultStatus: 'unscored',
      feedback: {
        immediate: '¡Respuesta aceptada por ti!',
        correction: exercise.correctSentence,
        explanation: exercise.explanation,
        canRetry: false,
      },
      firstTryFailed: attempts.firstTryFailed,
    })
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <p className="m-0 max-w-[65ch] text-body-md leading-relaxed text-pretty text-fg-muted">
        Hay un error. Escribe la oración completa ya corregida.
      </p>

      <div className="flex flex-col items-center gap-2 rounded-3xl bg-sky px-8 py-8 text-center text-ink">
        <span className="text-caption font-bold uppercase tracking-[0.18em] text-ink/80">
          Oración a revisar
        </span>
        <p className="m-0 font-display text-h3 font-bold leading-snug text-balance sm:text-h2">
          {exercise.sentence}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="error-correction-input" className="text-body-sm font-bold text-fg">
          Oración corregida
        </label>
        <input
          id="error-correction-input"
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              submit()
            }
          }}
          disabled={done || showSelfAssess}
          placeholder="Escribe la forma correcta…"
          aria-label="Oración corregida"
          className="min-h-14 rounded-2xl border-2 border-primary bg-field px-5 py-3.5 text-body-lg text-fg focus-ring placeholder:text-fg-muted disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
        />
      </div>

      {feedback?.immediate && !done && !showSelfAssess ? (
        <p role="alert" className="text-body-sm text-error font-medium">
          {feedback.immediate}
        </p>
      ) : null}

      {showSelfAssess && (
        <SelfAssessPrompt
          canonicalAnswer={exercise.correctSentence}
          userAnswer={answer.trim()}
          onMistake={handleSelfMistake}
          onSelfApprove={handleSelfApprove}
        />
      )}

      {!done && !showSelfAssess && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {showAlreadyCorrectBtn ? (
            <button
              type="button"
              onClick={handleAlreadyCorrect}
              className="min-h-11 cursor-pointer rounded-md border-none bg-transparent px-1 text-body-md font-medium text-fg-muted underline underline-offset-4 transition-colors hover:text-fg focus-ring"
            >
              Está correcta
            </button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="rounded-full px-8 font-bold"
            onClick={submit}
            disabled={!answer.trim()}
          >
            <span>Comprobar</span>
            <span
              className="hidden rounded-md bg-white/25 px-2 py-0.5 text-tiny font-bold text-on-accent sm:inline-flex"
              aria-hidden
            >
              Enter
            </span>
          </Button>
        </div>
      )}
    </div>
  )
}
