'use client'

import { useState, useEffect } from 'react'
import { Lightbulb } from 'lucide-react'
import { ExerciseShell } from '@/components/exercises/ExerciseShell'
import type { ExerciseResult } from '@/components/exercises/ExerciseShell'
import type { GenericPayload, PracticeExercise, PracticeSubmitHandler } from '@/lib/practice/types'
import { getGenericHint } from '@/lib/practice/exercise-renderer/hints'
import {
  getGenericTitle,
  getGenericSupportsHint,
  renderGenericExercise,
} from '@/lib/practice/exercise-renderer/generic-registry'
import { UnsupportedExercise } from '@/lib/practice/exercise-renderer/UnsupportedExercise'

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
  const [result, setResult] = useState<ExerciseResult | null>(null)
  const [hintCount, setHintCount] = useState(0)

  useEffect(() => {
    setResult(null)
    setHintCount(0)
  }, [exercise.id])

  function handleResult(
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: { score?: number },
  ) {
    if (isProduction) {
      onSubmit(isCorrect, userAnswer, extras)
      return
    }
    setResult({ isCorrect, userAnswer, timeMs, score: extras?.score })
  }

  function handleContinue() {
    if (!result) return
    onSubmit(
      result.isCorrect,
      result.userAnswer,
      result.score != null ? { score: result.score } : undefined,
    )
  }

  function handleSkip() {
    onSubmit(false, 'skip')
  }

  function handleHint() {
    setHintCount(n => n + 1)
  }

  const supportsHint = getGenericSupportsHint(data.type)

  const content = renderGenericExercise(data, {
    onResult: handleResult,
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
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border-default bg-surface-raised text-fg-subtle transition-all duration-150 hover:border-border-strong hover:text-fg-muted cursor-pointer"
    >
      <Lightbulb size={14} aria-hidden />
    </button>
  ) : null

  return (
    <div className={focusUi ? 'phoneme-focus__session' : 'flex flex-col gap-4'}>
      <ExerciseShell
        title={getGenericTitle(data.type)}
        hint={getGenericHint(data)}
        result={result}
        onContinue={handleContinue}
        onSkip={handleSkip}
        hintSlot={hintSlot}
      >
        {content ?? <UnsupportedExercise slug={slug} onSkip={handleSkip} />}
      </ExerciseShell>
    </div>
  )
}
