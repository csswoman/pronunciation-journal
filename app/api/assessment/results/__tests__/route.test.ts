import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  validateBody: vi.fn(),
  persistAssessmentOutcome: vi.fn(),
}))

vi.mock('@/lib/api/guards', () => ({
  requireSameOrigin: () => null,
  requireUser: async () => ({ user: { id: 'u1' }, error: null }),
  rateLimit: () => ({ limited: false, error: null }),
  validateBody: mocks.validateBody,
  SECURE_HEADERS: { 'Cache-Control': 'no-store' },
  publicErrorResponse: (status: number, message: string) =>
    Response.json({ error: message }, { status }),
}))

vi.mock('@/lib/courses/assessment-queries', () => ({
  persistAssessmentOutcome: mocks.persistAssessmentOutcome,
}))

import { AssessmentResultSchema, POST } from '../route'

function reqWith(body: unknown): Request {
  return new Request('http://x/api/assessment/results', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mocks.validateBody.mockReset()
  mocks.persistAssessmentOutcome.mockReset()
})

describe('assessment results route', () => {
  it('returns the validation response when the body is invalid', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: null,
      error: Response.json({ error: 'Invalid request body' }, { status: 400 }),
    })

    const res = await POST(reqWith({}) as never)

    expect(res.status).toBe(400)
    expect(mocks.persistAssessmentOutcome).not.toHaveBeenCalled()
  })

  it('saves a valid assessment result for the authenticated user', async () => {
    const result = {
      assignedLevel: 'B1',
      passed: true,
      passedLevels: ['a1', 'a2'],
      score: 8,
      total: 10,
      topicScores: [{ lessonSlug: 'intro', title: 'Intro', correct: 8, total: 10 }],
      strengths: [{ lessonSlug: 'intro', title: 'Intro' }],
      needsReview: [],
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
    mocks.validateBody.mockResolvedValueOnce({
      data: { mode: 'placement', evaluatedLevel: 'b1', result },
      error: null,
    })

    const res = await POST(reqWith({}) as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(mocks.persistAssessmentOutcome).toHaveBeenCalledWith('u1', 'placement', result, 'b1')
  })

  it('strictly validates bounded concept signals', () => {
    const body = {
      mode: 'placement',
      result: {
        assignedLevel: 'B1',
        passed: true,
        passedLevels: ['a1'],
        score: 1,
        total: 1,
        topicScores: [],
        strengths: [],
        needsReview: [],
        conceptSignals: [{
          lessonSlug: 'intro',
          level: 'b1',
          title: 'Intro',
          selfRating: 'familiar',
          status: 'review',
          correct: 2,
          total: 1,
          assessedAt: '2026-07-18T12:00:00.000Z',
        }],
      },
    }

    expect(AssessmentResultSchema.safeParse(body).success).toBe(false)
    expect(AssessmentResultSchema.safeParse({
      ...body,
      result: {
        ...body.result,
        conceptSignals: Array.from({ length: 101 }, () => ({
          ...body.result.conceptSignals[0],
          correct: 1,
        })),
      },
    }).success).toBe(false)
  })
})
