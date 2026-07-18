import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const cacheQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null }),
  }
  const cacheClient = {
    from: vi.fn(() => cacheQuery),
  }
  return {
    validateBody: vi.fn(),
    callWithFallback: vi.fn(),
    cacheQuery,
    cacheClient,
  }
})

vi.mock('@/lib/api/guards', () => ({
  requireSameOrigin: () => null,
  requireUser: async () => ({ user: { id: 'u1' }, error: null }),
  rateLimit: () => ({ limited: false, error: null }),
  validateBody: mocks.validateBody,
  publicErrorResponse: (status: number, message: string) =>
    Response.json({ error: message }, { status }),
  redactError: (error: unknown) => error,
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => mocks.cacheClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  getSupabaseAdminClient: () => mocks.cacheClient,
}))

vi.mock('@/lib/gemini/client', () => ({
  callWithFallback: mocks.callWithFallback,
  getErrorStatus: () => 500,
  stripJsonFences: (text: string) => text,
}))

import { POST } from '../route'

function reqWith(): Request {
  return new Request('http://x/api/gemini/deck-suggest', { method: 'POST', body: '{}' })
}

beforeEach(() => {
  mocks.validateBody.mockReset()
  mocks.callWithFallback.mockReset()
  mocks.cacheQuery.single.mockResolvedValue({ data: null })
  mocks.cacheClient.from.mockClear()
  process.env.GEMINI_API_KEY = 'test'
})

describe('deck-suggest route', () => {
  it('parses and returns valid AI deck suggestions', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { deckName: 'Travel', difficulty: 1 },
      error: null,
    })
    mocks.callWithFallback.mockImplementationOnce(async (_key, _params, parse) =>
      parse(JSON.stringify({ suggestions: [{ word: 'passport', meaning: 'travel document' }] }))
    )

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.suggestions).toEqual([{ word: 'passport', meaning: 'travel document' }])
  })

  it('rejects malformed AI suggestions through the response schema', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { deckName: 'Travel', difficulty: 1, seed: 'fresh' },
      error: null,
    })
    mocks.callWithFallback.mockImplementationOnce(async (_key, _params, parse) =>
      parse(JSON.stringify({ suggestions: [{ word: '', meaning: '' }] }))
    )

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to generate deck suggestions')
  })

  it('degrades safely when Gemini returns syntactically malformed JSON', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { deckName: 'Travel', difficulty: 1 },
      error: null,
    })
    mocks.callWithFallback.mockImplementationOnce(async (_key, _params, parse) =>
      parse('```json\n{"suggestions": [\n```')
    )

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to generate deck suggestions' })
    expect(JSON.stringify(body)).not.toContain('Unexpected token')
  })
})
