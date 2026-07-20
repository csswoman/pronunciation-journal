import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  upsert: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => table === 'assessment_results'
      ? { insert: mocks.insert }
      : { upsert: mocks.upsert },
  }),
}))

import { persistAssessmentOutcome, saveAssessmentResult } from '../assessment-queries'
import type { AssessmentResult } from '../assessment'

const result: AssessmentResult = {
  assignedLevel: 'B1',
  passed: true,
  passedLevels: ['a1', 'a2'],
  score: 8,
  total: 10,
  topicScores: [{ lessonSlug: 'intro', title: 'Intro', correct: 1, total: 2 }],
  strengths: [],
  needsReview: [{ lessonSlug: 'intro', title: 'Intro' }],
  conceptSignals: [{
    lessonSlug: 'intro',
    level: 'b1',
    title: 'Intro',
    selfRating: 'familiar',
    status: 'review',
    correct: 1,
    total: 2,
    assessedAt: '2026-07-18T12:00:00.000Z',
  }],
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.insert.mockResolvedValue({ error: null })
  mocks.upsert.mockResolvedValue({ error: null })
})

describe('assessment persistence', () => {
  it('stores a versioned topic and concept payload', async () => {
    await saveAssessmentResult('u1', 'placement', result, 'b1')

    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      topic_scores: {
        version: 2,
        topics: result.topicScores,
        concepts: result.conceptSignals,
      },
    }))
  })

  it('throws when the profile upsert fails', async () => {
    const failure = { code: '42501', message: 'permission denied' }
    mocks.upsert.mockResolvedValue({ error: failure })

    await expect(persistAssessmentOutcome('u1', 'placement', result)).rejects.toEqual(failure)
  })

  it('throws non-missing-table assessment insert errors', async () => {
    const failure = { code: '42501', message: 'permission denied' }
    mocks.insert.mockResolvedValue({ error: failure })

    await expect(saveAssessmentResult('u1', 'placement', result)).rejects.toEqual(failure)
  })
})
