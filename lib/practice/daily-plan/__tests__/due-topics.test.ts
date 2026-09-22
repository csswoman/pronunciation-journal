import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { buildDueTopicSteps } from '@/lib/practice/daily-plan/due-topics'
import { candidate, selectDailyCandidates } from '@/lib/practice/daily-plan/policy'
import type { DailyStep } from '@/lib/practice/types'

const realFetch = globalThis.fetch

beforeAll(() => {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const slug = url.split('/').pop()?.replace('.json', '') ?? ''
    const file = path.join(process.cwd(), 'public', 'grammar-decks', `${slug}.json`)
    if (!fs.existsSync(file)) {
      return new Response('not found', { status: 404 })
    }
    return new Response(fs.readFileSync(file, 'utf8'), { status: 200 })
  }) as typeof fetch
})

afterAll(() => {
  globalThis.fetch = realFetch
})

describe('buildDueTopicSteps', () => {
  it('maps an overdue topic with a known deck into a review_topic step', async () => {
    const steps = await buildDueTopicSteps([
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

  it('drops topics with no matching deck', async () => {
    const steps = await buildDueTopicSteps([
      { topic: 'grammar:not-a-real-topic', nextReviewAt: '2026-09-20T00:00:00.000Z' },
    ])
    expect(steps).toHaveLength(0)
  })

  it('caps at the given limit', async () => {
    const steps = await buildDueTopicSteps([
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
  it('does not let a due topic push the plan past the due-step cap', async () => {
    const [topicStep] = await buildDueTopicSteps([
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

