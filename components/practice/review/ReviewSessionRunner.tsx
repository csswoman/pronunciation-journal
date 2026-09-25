'use client'

// Planned structure:
// <ReviewSessionRunner>
//   <LoadingOverlay (when phase === 'loading')>
//   <ErrorOverlay (when phase === 'error')>
//   <DoneOverlay (when phase === 'done')>
//   <ReviewSessionLauncher (when phase === 'session')>
// </ReviewSessionRunner>

import { useEffect, useRef } from 'react'
import { useReviewSession, type ReviewCategory } from '@/hooks/useReviewSession'
import { ReviewSessionLauncher } from './ReviewSessionLauncher'
import type { FailedSentenceItem, ReviewHubSummary } from '@/lib/review/types'

export type ReviewSessionAction =
  | { type: 'review' }
  | { type: 'short_review' }
  | { type: 'category'; category: ReviewCategory }
  | { type: 'failed_item'; item: FailedSentenceItem }
  | { type: 'topic'; topic: string }

interface Props {
  action: ReviewSessionAction
  summary: ReviewHubSummary
  onExit: () => void
}

function isSameAction(a: ReviewSessionAction | null, b: ReviewSessionAction): boolean {
  if (!a) return false
  if (a.type !== b.type) return false
  if (a.type === 'review' || a.type === 'short_review') return true
  if (a.type === 'category' && b.type === 'category') return a.category === b.category
  if (a.type === 'topic' && b.type === 'topic') return a.topic === b.topic
  if (a.type === 'failed_item' && b.type === 'failed_item') return a.item.contentId === b.item.contentId
  return false
}

export function ReviewSessionRunner({ action, summary, onExit }: Props) {
  const {
    userId,
    state,
    sessionKey,
    startReview,
    startShortReview,
    startCategoryReview,
    startFailedItem,
    startTopic,
    advanceStep,
    exitSession,
  } = useReviewSession()
  const startedActionRef = useRef<ReviewSessionAction | null>(null)

  useEffect(() => {
    if (isSameAction(startedActionRef.current, action)) return
    startedActionRef.current = action

    if (action.type === 'review') {
      void startReview(summary)
    } else if (action.type === 'short_review') {
      void startShortReview(summary)
    } else if (action.type === 'category') {
      void startCategoryReview(summary, action.category)
    } else if (action.type === 'failed_item') {
      void startFailedItem(action.item)
    } else if (action.type === 'topic') {
      void startTopic(action.topic)
    }
  }, [action, summary, startReview, startShortReview, startCategoryReview, startFailedItem, startTopic])

  const handleExit = () => {
    exitSession()
    onExit()
  }

  if (state.phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base/80 backdrop-blur-xs text-fg-muted font-caption">
        Cargando sesión…
      </div>
    )
  }

  if (state.phase === 'error') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-surface-base p-4 text-center">
        <p className="font-body-sm text-fg-error">No se pudo cargar la sesión de repaso.</p>
        <button
          type="button"
          onClick={handleExit}
          className="focus-ring rounded-[var(--radius-sm)] border border-border-default px-4 py-2 text-caption font-semibold text-fg"
        >
          Volver al hub
        </button>
      </div>
    )
  }

  if (state.phase === 'done') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-surface-base p-4 text-center">
        <p className="font-body-sm font-medium text-fg">¡Repaso completado!</p>
        <button
          type="button"
          onClick={handleExit}
          className="focus-ring rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-caption font-semibold text-primary-fg"
        >
          Volver al hub
        </button>
      </div>
    )
  }

  return (
    <ReviewSessionLauncher
      state={state}
      userId={userId}
      sessionKey={sessionKey}
      onStepComplete={advanceStep}
      onExit={handleExit}
    />
  )
}
