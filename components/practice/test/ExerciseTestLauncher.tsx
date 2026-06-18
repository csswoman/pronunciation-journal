'use client'

import PracticeSession from '@/components/practice/PracticeSession'
import type { PracticeContext, PracticeExercise } from '@/lib/practice/types'

export type ExerciseTestSessionState =
  | { phase: 'idle' }
  | { phase: 'session'; exercises: PracticeExercise[]; label: string; context: PracticeContext }

interface Props {
  state: ExerciseTestSessionState
  sessionKey: number
  onExit: () => void
}

export function ExerciseTestLauncher({ state, sessionKey, onExit }: Props) {
  if (state.phase !== 'session') return null

  return (
    <div className="exercise-test-viewport fixed inset-0 z-40">
      <PracticeSession
        key={sessionKey}
        context={state.context}
        exercises={state.exercises}
        sessionLength={state.exercises.length}
        sessionLabel={state.label}
        onSessionComplete={onExit}
        onExit={onExit}
      />
    </div>
  )
}
