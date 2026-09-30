'use client'

import { useCallback, useState } from 'react'
import { buildReviewPlan } from '@/lib/practice/daily-plan'
import { buildFailedItemStep } from '@/lib/review/build-failed-exercises'
import { useAuth } from '@/components/auth/AuthProvider'
import type { DailyStep } from '@/lib/practice/types'
import type { FailedSentenceItem } from '@/lib/review/types'
import type { ReviewHubSummary } from '@/lib/review/types'
import { composeReviewSessionPlan } from '@/lib/review/session-plan'
import { getEffectiveLearnerLevel } from '@/lib/learner-level/client-queries'

/** Real subset of the review queue a "Repasar grupo" button can scope to. */
export type ReviewCategory = 'weak_words' | 'due_words' | 'sounds'

/** Cap for the "Solo 10 · 4 min" quick session — a real prefix of the full plan, not a separate dataset. */
const SHORT_REVIEW_EXERCISE_LIMIT = 10

export type ReviewSessionPhase =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error' }
  | { phase: 'session'; steps: DailyStep[]; stepIndex: number }
  | { phase: 'done' }

/** Truncates a composed plan to at most `limit` exercises, dropping empty trailing steps. */
function truncateToExerciseLimit(steps: DailyStep[], limit: number): DailyStep[] {
  const result: DailyStep[] = []
  let remaining = limit
  for (const step of steps) {
    if (remaining <= 0) break
    if (step.exercises.length === 0) {
      // Link steps (Essential Words, Inmersión) carry no exercises — keep them
      // out of the short session so "Solo 10" stays a quick, self-contained pass.
      continue
    }
    if (step.exercises.length <= remaining) {
      result.push(step)
      remaining -= step.exercises.length
    } else {
      result.push({ ...step, exercises: step.exercises.slice(0, remaining) })
      remaining = 0
    }
  }
  return result
}

export function useReviewSession() {
  const { user } = useAuth()
  const [state, setState] = useState<ReviewSessionPhase>({ phase: 'idle' })
  const [sessionKey, setSessionKey] = useState(0)

  const startReview = useCallback(async (
    summary: ReviewHubSummary,
    options?: { category?: ReviewCategory; exerciseLimit?: number },
  ) => {
    if (!user) return
    setState({ phase: 'loading' })
    try {
      const learnerLevel = await getEffectiveLearnerLevel(user.id)
      const category = options?.category
      // A category button scopes the plan to just that domain's real data —
      // it never falls back to the full queue: weakWords/dueWords/dueSoundIds
      // become empty for the domains the learner did not pick.
      const includeTopics = !category
      const [plan, topicResponse] = await Promise.all([
        buildReviewPlan(user.id, {
          failedItems: category ? [] : summary.failedSentences,
          weakWords: !category || category === 'weak_words' ? summary.weakWords : [],
          dueWords: !category || category === 'due_words' ? summary.dueWords : [],
          dueSoundIds: !category || category === 'sounds' ? summary.soundsDue.map((sound) => sound.soundId) : [],
          dueLessons: category ? [] : summary.dueLessons,
          essentialWordsDue: category ? [] : summary.essentialWordsDue,
          includeChunkReview: !category,
          learnerLevel: learnerLevel.level,
        }),
        includeTopics
          ? fetch('/api/review/topics', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              topics: [...summary.dueTopics, ...summary.weakTopics].map(({ topic }) => topic),
            }),
          }).catch(() => null)
          : Promise.resolve(null),
      ])
      const topicSteps: DailyStep[] = topicResponse?.ok ? (await topicResponse.json()).steps ?? [] : []
      const sessionPlan = composeReviewSessionPlan(plan, topicSteps)
      if (sessionPlan.nothingDue) {
        setState({ phase: 'done' })
        return
      }
      const steps = options?.exerciseLimit
        ? truncateToExerciseLimit(sessionPlan.steps, options.exerciseLimit)
        : sessionPlan.steps
      if (steps.length === 0) {
        setState({ phase: 'done' })
        return
      }
      setSessionKey((k) => k + 1)
      setState({ phase: 'session', steps, stepIndex: 0 })
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

  const startShortReview = useCallback(
    (summary: ReviewHubSummary) => startReview(summary, { exerciseLimit: SHORT_REVIEW_EXERCISE_LIMIT }),
    [startReview],
  )

  const startCategoryReview = useCallback(
    (summary: ReviewHubSummary, category: ReviewCategory) => startReview(summary, { category }),
    [startReview],
  )

  return {
    userId: user?.id ?? null,
    state,
    sessionKey,
    startReview,
    startShortReview,
    startCategoryReview,
    startFailedItem,
    startTopic,
    advanceStep,
    exitSession,
    reset,
  }
}
