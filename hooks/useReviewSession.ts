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
      const [plan, topicResponse] = await Promise.all([
        buildReviewPlan(user.id),
        fetch('/api/review/topics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }).catch(() => null),
      ])
      const topicSteps: DailyStep[] = topicResponse?.ok ? (await topicResponse.json()).steps ?? [] : []
      plan.steps.push(...topicSteps)
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

  const startTopic = useCallback(async (topic: string) => {
    setState({ phase: 'loading' })
    try {
      const response = await fetch('/api/review/topics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ topic }) })
      const { steps } = response.ok ? await response.json() : { steps: [] }
      if (!steps?.length) return setState({ phase: 'error' })
      setSessionKey((key) => key + 1)
      setState({ phase: 'session', steps, stepIndex: 0 })
    } catch { setState({ phase: 'error' }) }
  }, [])

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
    startTopic,
    advanceStep,
    exitSession,
    reset,
  }
}
