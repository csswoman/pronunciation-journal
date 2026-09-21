import dynamic from 'next/dynamic'
import type { ReviewSessionPhase } from '@/hooks/useReviewSession'
import type { SessionResult } from '@/lib/practice/types'
import { persistReviewStepProgress } from '@/lib/review/complete-step'
import { ReviewLinkStep } from './ReviewLinkStep'

const PracticeSession = dynamic(() => import('@/components/practice/PracticeSession'), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base text-fg-muted font-caption">
      Cargando sesión…
    </div>
  ),
})

interface Props {
  state: ReviewSessionPhase
  userId: string | null
  sessionKey: number
  onStepComplete: () => void
  onExit: () => void
}

export function ReviewSessionLauncher({ state, userId, sessionKey, onStepComplete, onExit }: Props) {
  if (state.phase !== 'session') return null

  const step = state.steps[state.stepIndex]
  const handleSessionComplete = async (result: SessionResult) => {
    try {
      await persistReviewStepProgress(userId, result)
    } catch (error) {
      console.error('[review] domain progress update failed', error)
    } finally {
      onStepComplete()
    }
  }
  if (step.href && step.exercises.length === 0) {
    return <ReviewLinkStep step={step} onContinue={onStepComplete} onExit={onExit} />
  }
  return (
    <div className="fixed inset-0 z-50">
      <PracticeSession
        key={`${sessionKey}-${state.stepIndex}`}
        context="review"
        exercises={step.exercises}
        sessionLength={step.exercises.length}
        sessionLabel={step.title}
        soundIpa={step.ipa}
        onSessionComplete={handleSessionComplete}
        onExit={onExit}
      />
    </div>
  )
}
