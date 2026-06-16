'use client'

import PracticeSession from '@/components/practice/PracticeSession'
import type { ReviewSessionPhase } from '@/hooks/useReviewSession'

interface Props {
  state: ReviewSessionPhase
  sessionKey: number
  onStepComplete: () => void
  onExit: () => void
}

export function ReviewSessionLauncher({ state, sessionKey, onStepComplete, onExit }: Props) {
  if (state.phase !== 'session') return null

  const step = state.steps[state.stepIndex]
  return (
    <div className="fixed inset-0 z-50 bg-[var(--surface-base)]">
      <PracticeSession
        key={`${sessionKey}-${state.stepIndex}`}
        context="review"
        exercises={step.exercises}
        sessionLength={step.exercises.length}
        sessionLabel={step.title}
        onSessionComplete={onStepComplete}
        onExit={onExit}
      />
    </div>
  )
}
