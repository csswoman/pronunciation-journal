import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  validateBody: vi.fn(),
  callWithFallback: vi.fn(),
}))

vi.mock('@/lib/api/guards', () => ({
  requireSameOrigin: () => null,
  requireUser: async () => ({ user: { id: 'u1' }, error: null }),
  rateLimit: () => ({ limited: false, error: null }),
  validateBody: mocks.validateBody,
  publicErrorResponse: (status: number, message: string) =>
    Response.json({ error: message }, { status }),
  redactError: (error: unknown) => error,
}))

vi.mock('@/lib/gemini/client', () => ({
  callWithFallback: mocks.callWithFallback,
  getErrorStatus: () => 500,
  stripJsonFences: (text: string) => text,
}))

import { POST } from '../route'

function reqWith(): Request {
  return new Request('http://x/api/gemini/grade-production', { method: 'POST', body: '{}' })
}

beforeEach(() => {
  mocks.validateBody.mockReset()
  mocks.callWithFallback.mockReset()
  process.env.GEMINI_API_KEY = 'test'
})

describe('grade-production route', () => {
  it('rounds a valid AI score and returns the grade', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: {
        targetItem: 'clarity',
        taskPrompt: 'Use clarity in a sentence.',
        production: 'Clarity helps the team move faster.',
        modality: 'written',
      },
      error: null,
    })
    mocks.callWithFallback.mockImplementationOnce(async (_key, _params, parse) =>
      parse(JSON.stringify({
        correct: true,
        usedTarget: true,
        grammaticallyCorrect: true,
        feedback: 'Good sentence.',
        score: 89.6,
      }))
    )

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.score).toBe(90)
  })

  it('rejects malformed AI grades through the response schema', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: {
        targetItem: 'clarity',
        taskPrompt: 'Use clarity in a sentence.',
        production: 'ok',
        modality: 'written',
      },
      error: null,
    })
    mocks.callWithFallback.mockImplementationOnce(async (_key, _params, parse) =>
      parse(JSON.stringify({ correct: true, score: 120 }))
    )

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to grade production')
  })
})
