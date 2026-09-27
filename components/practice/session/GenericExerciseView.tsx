'use client'

// Planned structure:
// <GenericExerciseView>
//   <ExerciseShell> — feedback and navigation for generic exercises
//     [registry content] — production exercises own their shell
//   <UnsupportedExercise /> — missing registry entry

import { useState, useEffect } from 'react'
import { Lightbulb } from "@/components/icons"
import { ExerciseShell } from '@/components/exercises/ExerciseShell'
import type { ExerciseResult } from '@/components/exercises/ExerciseShell'
import type { GenericPayload, PracticeExercise, PracticeSubmitExtras, PracticeSubmitHandler } from '@/lib/practice/types'
import { getGenericHint } from '@/lib/practice/exercise-renderer/hints'
import {
  getGenericTitle,
  getGenericSupportsHint,
  renderGenericExercise,
} from '@/lib/practice/exercise-renderer/generic-registry'
import { UnsupportedExercise } from '@/lib/practice/exercise-renderer/UnsupportedExercise'
import { topicDisplayLabel } from '@/lib/practice/topic-labels'
import { normalizeSubmitEvidence, type ProducerSubmitExtras } from '@/lib/practice/submit-evidence'

interface Props {
  exercise: PracticeExercise & { payload: GenericPayload }
  onSubmit: PracticeSubmitHandler
  focusUi?: boolean
}

const PRODUCTION_TYPES = new Set(['written_production', 'spoken_production'])

export function GenericExerciseView({ exercise, onSubmit, focusUi = false }: Props) {
  const { slug, payload } = exercise
  const data = payload.data
  const isProduction = PRODUCTION_TYPES.has(data.type)
  const [result, setResult] = useState<(ExerciseResult & { evidence: PracticeSubmitExtras }) | null>(null)
  const [hintCount, setHintCount] = useState(0)
  const [retryKey, setRetryKey] = useState(0)
  const [firstTryFailed, setFirstTryFailed] = useState(false)
  const [firstResponseTimeMs, setFirstResponseTimeMs] = useState<number | null>(null)

  useEffect(() => {
    setResult(null)
    setHintCount(0)
    setRetryKey(0)
    setFirstTryFailed(false)
    setFirstResponseTimeMs(null)
  }, [exercise.id])

  function handleResult(
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: ProducerSubmitExtras,
  ) {
    const normalized = normalizeSubmitEvidence(extras, userAnswer)
    const responseTimeMs = firstResponseTimeMs ?? normalized.responseTimeMs ?? timeMs
    if (firstResponseTimeMs === null) {
      setFirstResponseTimeMs(responseTimeMs)
    }
    const hadPriorFailure = firstTryFailed || normalized.firstTryFailed === true
      || (normalized.status === 'answered' && !isCorrect)
    const evidence: PracticeSubmitExtras = {
      ...normalized,
      responseTimeMs,
      firstTryFailed: hadPriorFailure,
      // The child's count can reflect the same hints passed down by this container.
      hintsUsed: Math.max(hintCount, normalized.hintsUsed ?? 0),
    }
    setFirstTryFailed(hadPriorFailure)
    setHintCount(evidence.hintsUsed ?? 0)

    if (isProduction) {
      onSubmit(isCorrect, userAnswer, evidence)
      return
    }
    setResult({ isCorrect, userAnswer, timeMs, score: evidence.score, feedback: evidence.feedback, evidence })
  }

  function handleContinue() {
    if (!result) return
    onSubmit(
      result.isCorrect,
      result.userAnswer,
      result.evidence,
    )
  }

  function handleRetry() {
    setResult(null)
    setRetryKey((key) => key + 1)
  }

  function handleSkip() {
    onSubmit(false, 'skip', {
      ...result?.evidence,
      status: 'skipped',
      firstTryFailed,
      hintsUsed: Math.max(hintCount, result?.evidence.hintsUsed ?? 0),
      responseTimeMs: firstResponseTimeMs ?? undefined,
    })
  }

  function handleHint() {
    setHintCount(n => n + 1)
  }

  const supportsHint = getGenericSupportsHint(data.type)

  const content = renderGenericExercise(data, {
    onResult: handleResult,
    onSkip: handleSkip,
    focusUi,
    onHint: handleHint,
    hintCount,
  })

  if (isProduction) {
    return (
      <div className={focusUi ? 'phoneme-focus__session' : 'flex flex-col gap-4'}>
        {content ?? <UnsupportedExercise slug={slug} onSkip={handleSkip} />}
      </div>
    )
  }

  const hintSlot = result === null && supportsHint ? (
    <button
      type="button"
      onClick={handleHint}
      aria-label="Mostrar pista"
      title="Mostrar pista"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-border-default bg-surface-raised text-fg-muted transition-all duration-150 hover:border-primary/40 hover:bg-surface-sunken hover:text-primary active:scale-95 focus-ring cursor-pointer shadow-xs"
    >
      <Lightbulb size={20} aria-hidden />
    </button>
  ) : null

  return (
    <div className={focusUi ? 'phoneme-focus__session' : 'flex flex-col gap-4'}>
      <ExerciseShell
        title={getGenericTitle(data.type)}
        eyebrow={topicDisplayLabel(data.topic) ?? undefined}
        hint={getGenericHint(data)}
        result={result}
        onContinue={handleContinue}
        onRetry={handleRetry}
        onSkip={handleSkip}
        hintSlot={hintSlot}
        surface="flat"
      >
        <div key={retryKey}>
          {content ?? <UnsupportedExercise slug={slug} onSkip={handleSkip} />}
        </div>
      </ExerciseShell>
    </div>
  )
}
