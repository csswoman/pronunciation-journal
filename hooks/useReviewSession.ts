'use client'

import { useCallback, useState } from 'react'
import { buildReviewPlan } from '@/lib/practice/daily-plan'
import { buildFailedItemStep } from '@/lib/review/build-failed-exercises'
import { useAuth } from '@/components/auth/AuthProvider'
import type { DailyStep } from '@/lib/practice/types'
import type { FailedSentenceItem } from '@/lib/review/types'

export type ReviewSessionPhase =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error' }
  | { phase: 'session'; steps: DailyStep[]; stepIndex: number }
  | { phase: 'done' }

export function useReviewSession() {
  const { user } = useAuth()
  const [state, setState] = useState<ReviewSessionPhase>({ phase: 'idle' })
  const [sessionKey, setSessionKey] = useState(0)

  const startReview = useCallback(async () => {
    if (!user) return
    setState({ phase: 'loading' })
    try {
      const plan = await buildReviewPlan(user.id)
      if (plan.nothingDue || plan.steps.length === 0) {
        setState({ phase: 'done' })
        return
      }
      setSessionKey((k) => k + 1)
      setState({ phase: 'session', steps: plan.steps, stepIndex: 0 })
    } catch {
      setState({ phase: 'error' })
    }
  }, [user])

  const startFailedItem = useCallback(
    async (item: FailedSentenceItem) => {
      if (!user || !item.drillable) return
      setState({ phase: 'loading' })
      try {
        const step = await buildFailedItemStep(item, 'review')
        if (!step) {
          setState({ phase: 'error' })
          return
        }
        setSessionKey((k) => k + 1)
        setState({ phase: 'session', steps: [step], stepIndex: 0 })
      } catch {
        setState({ phase: 'error' })
      }
    },
    [user],
  )

  const advanceStep = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'session') return prev
      const next = prev.stepIndex + 1
      if (next >= prev.steps.length) return { phase: 'done' }
      return { phase: 'session', steps: prev.steps, stepIndex: next }
    })
  }, [])

  const exitSession = useCallback(() => {
    setState({ phase: 'idle' })
  }, [])

  const reset = useCallback(() => {
    setState({ phase: 'idle' })
  }, [])

  return {
    state,
    sessionKey,
    startReview,
    startFailedItem,
    advanceStep,
    exitSession,
    reset,
  }
}
