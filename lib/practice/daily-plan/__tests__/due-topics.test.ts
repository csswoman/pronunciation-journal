import { describe, it, expect } from 'vitest'
import { buildDueTopicSteps } from '@/lib/practice/daily-plan/due-topics'
import { candidate, selectDailyCandidates } from '@/lib/practice/daily-plan/policy'
import type { DailyStep } from '@/lib/practice/types'

describe('buildDueTopicSteps', () => {
  it('maps an overdue topic with a known deck into a review_topic step', () => {
    const steps = buildDueTopicSteps([
      { topic: 'grammar:present simple', nextReviewAt: '2026-09-20T00:00:00.000Z' },
    ])
    expect(steps).toHaveLength(1)
    expect(steps[0]!.id).toMatch(/^review_topic:/)
    expect(steps[0]!.selection).toEqual({
      reason: 'due',
      targetRefs: ['topic:grammar:present simple'],
      source: 'topic_srs',
    })
  })

  it('drops topics with no matching deck', () => {
    const steps = buildDueTopicSteps([
      { topic: 'grammar:not-a-real-topic', nextReviewAt: '2026-09-20T00:00:00.000Z' },
    ])
    expect(steps).toHaveLength(0)
  })

  it('caps at the given limit', () => {
    const steps = buildDueTopicSteps([
      { topic: 'grammar:present simple', nextReviewAt: '2026-09-18T00:00:00.000Z' },
      { topic: 'grammar:present simple', nextReviewAt: '2026-09-19T00:00:00.000Z' },
      { topic: 'grammar:present simple', nextReviewAt: '2026-09-20T00:00:00.000Z' },
    ], 2)
    expect(steps).toHaveLength(2)
  })
})

function wordStep(id: string): DailyStep {
  return { kind: 'word_review', id, title: id, subtitle: '', icon: 'Sparkles', exercises: [], estMinutes: 2 } as DailyStep
}

describe('due topic candidates respect MAX_DUE_STEPS', () => {
  it('does not let a due topic push the plan past the due-step cap', () => {
    const [topicStep] = buildDueTopicSteps([
      { topic: 'grammar:present simple', nextReviewAt: '2026-09-20T00:00:00.000Z' },
    ])
    const candidates = [
      candidate(wordStep('due-word-1'), { reason: 'due', targetRefs: ['word:a'], source: 'word_review' }),
      candidate(wordStep('due-word-2'), { reason: 'due', targetRefs: ['word:b'], source: 'word_review' }),
      candidate(topicStep!, topicStep!.selection!),
    ]

    const selected = selectDailyCandidates(candidates, { limit: 3, maxDueSteps: 2 })
    expect(selected).toHaveLength(2)
    expect(selected.some((s) => s.id === topicStep!.id)).toBe(false)
  })
})
