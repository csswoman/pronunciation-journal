import { describe, expect, it } from 'vitest'
import { composeReviewSessionPlan } from '@/lib/review/session-plan'
import type { DailyStep } from '@/lib/practice/types'

const step = (id: string, exerciseCount = 1) => ({
  id,
  kind: 'concept',
  title: id,
  subtitle: '',
  icon: 'book-open',
  exercises: Array.from({ length: exerciseCount }, (_, index) => ({ id: `${id}:${index}` })),
  estMinutes: 1,
}) as unknown as DailyStep

describe('composeReviewSessionPlan', () => {
  it('keeps topic-only queues reviewable', () => {
    const result = composeReviewSessionPlan({ steps: [], totalExercises: 0, nothingDue: true }, [step('topic')])
    expect(result).toMatchObject({ nothingDue: false, totalExercises: 1 })
    expect(result.steps.map(({ id }) => id)).toEqual(['topic'])
  })

  it('preserves base steps, dedupes ids, and derives totals from the combined queue', () => {
    const base = step('base', 2)
    const duplicate = step('base', 8)
    const topic = step('topic', 3)
    const result = composeReviewSessionPlan({ steps: [base], totalExercises: 99, nothingDue: false }, [duplicate, topic])
    expect(result.steps).toEqual([base, topic])
    expect(result.totalExercises).toBe(5)
    expect(result.nothingDue).toBe(false)
  })

  it('keeps an actually empty queue empty', () => {
    expect(composeReviewSessionPlan({ steps: [], totalExercises: 0, nothingDue: false }, [])).toMatchObject({
      steps: [], totalExercises: 0, nothingDue: true,
    })
  })
})
