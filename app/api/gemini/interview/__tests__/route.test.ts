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
  return new Request('http://x/api/gemini/interview', { method: 'POST', body: '{}' })
}

beforeEach(() => {
  mocks.validateBody.mockReset()
  mocks.callWithFallback.mockReset()
  process.env.GEMINI_API_KEY = 'test'
})

describe('interview route', () => {
  it('parses and returns a valid interview script', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { scenario: 'frontend', level: 'intermediate' },
      error: null,
    })
    mocks.callWithFallback.mockImplementationOnce(async (_key, _params, parse) =>
      parse(JSON.stringify({
        title: 'Frontend interview',
        turns: [
          { role: 'interviewer', text: 'Tell me about rendering.' },
          { role: 'candidate', text: 'Rendering turns state into UI.' },
        ],
      }))
    )

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.turns).toHaveLength(2)
  })

  it('rejects malformed AI interview responses through the response schema', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { scenario: 'frontend', level: 'intermediate' },
      error: null,
    })
    mocks.callWithFallback.mockImplementationOnce(async (_key, _params, parse) =>
      parse(JSON.stringify({ title: 'Bad', questions: [] }))
    )

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to generate interview')
  })
})
