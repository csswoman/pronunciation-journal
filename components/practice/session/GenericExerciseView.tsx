'use client'

import { useState, useEffect } from 'react'
import { ExerciseShell } from '@/components/exercises/ExerciseShell'
import type { ExerciseResult } from '@/components/exercises/ExerciseShell'
import type { GenericPayload, PracticeExercise } from '@/lib/practice/types'
import { getGenericHint } from '@/lib/practice/exercise-renderer/hints'
import {
  getGenericTitle,
  renderGenericExercise,
} from '@/lib/practice/exercise-renderer/generic-registry'
import { UnsupportedExercise } from '@/lib/practice/exercise-renderer/UnsupportedExercise'

interface Props {
  exercise: PracticeExercise & { payload: GenericPayload }
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  focusUi?: boolean
}

export function GenericExerciseView({ exercise, onSubmit, focusUi = false }: Props) {
  const { slug, payload } = exercise
  const data = payload.data
  const [result, setResult] = useState<ExerciseResult | null>(null)

  useEffect(() => {
    setResult(null)
  }, [exercise.id])

  function handleResult(isCorrect: boolean, userAnswer: string, timeMs: number) {
    setResult({ isCorrect, userAnswer, timeMs })
  }

  function handleContinue() {
    if (!result) return
    onSubmit(result.isCorrect, result.userAnswer)
  }

  function handleSkip() {
    onSubmit(false, 'skip')
  }

  const content = renderGenericExercise(data, {
    onResult: handleResult,
    focusUi,
  })

  return (
    <div className={focusUi ? 'phoneme-focus__session' : 'flex flex-col gap-4'}>
      <ExerciseShell
        title={getGenericTitle(data.type)}
        hint={getGenericHint(data)}
        result={result}
        onContinue={handleContinue}
        onSkip={handleSkip}
      >
        {content ?? <UnsupportedExercise slug={slug} onSkip={handleSkip} />}
      </ExerciseShell>
    </div>
  )
}
