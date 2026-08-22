import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  validateBody: vi.fn(),
  callWithFallback: vi.fn(),
}))

vi.mock('@/lib/api/guards', () => ({
  requireSameOrigin: () => null,
  requireUser: async () => ({ user: { id: 'u1' }, error: null }),
  checkLayeredRateLimit: () => ({ limited: false, error: null }),
  rateLimit: () => ({ limited: false, error: null }),
  validateBody: mocks.validateBody,
  SECURE_HEADERS: { 'Cache-Control': 'no-store' },
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
  return new Request('http://x/api/gemini/phrases', { method: 'POST', body: '{}' })
}

beforeEach(() => {
  mocks.validateBody.mockReset()
  mocks.callWithFallback.mockReset()
  process.env.GEMINI_API_KEY = 'test'
})

describe('phrases route', () => {
  it('returns validated generated phrases', async () => {
    mocks.validateBody.mockResolvedValueOnce({ data: { exclude: ['old phrase'] }, error: null })
    mocks.callWithFallback.mockImplementationOnce(async (_key, _params, parse) =>
      parse(JSON.stringify({ phrases: ['Practice clear speech', 'Hold the final sound'] }))
    )

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.phrases).toEqual(['Practice clear speech', 'Hold the final sound'])
  })

  it('rejects empty or oversized AI phrase payloads', async () => {
    mocks.validateBody.mockResolvedValueOnce({ data: {}, error: null })
    mocks.callWithFallback.mockImplementationOnce(async (_key, _params, parse) =>
      parse(JSON.stringify({ phrases: [''] }))
    )

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to generate phrases')
  })
})
