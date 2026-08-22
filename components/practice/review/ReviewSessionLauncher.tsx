import dynamic from 'next/dynamic'
import type { ReviewSessionPhase } from '@/hooks/useReviewSession'

const PracticeSession = dynamic(() => import('@/components/practice/PracticeSession'), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base text-fg-muted font-caption">
      Cargando sesión…
    </div>
  ),
})

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
    <div className="fixed inset-0 z-50">
      <PracticeSession
        key={`${sessionKey}-${state.stepIndex}`}
        context="review"
        exercises={step.exercises}
        sessionLength={step.exercises.length}
        sessionLabel={step.title}
        soundIpa={step.ipa}
        onSessionComplete={onStepComplete}
        onExit={onExit}
      />
    </div>
  )
}
