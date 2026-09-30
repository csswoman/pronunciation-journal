import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  validateBody: vi.fn(),
  callWithFallback: vi.fn(),
  cache: new Map<string, unknown>(),
  recordSharedCacheHit: vi.fn(),
}))

vi.mock('@/lib/api/guards', () => ({
  requireSameOrigin: () => null,
  requireUser: async () => ({ user: { id: 'u1' }, error: null }),
  checkLayeredRateLimit: () => ({ limited: false, error: null }),
  validateBody: mocks.validateBody,
}))
vi.mock('@/lib/gemini/client', () => ({
  callWithFallback: mocks.callWithFallback,
  getErrorStatus: (error: unknown) =>
    typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status?: number }).status
      : undefined,
  stripJsonFences: (text: string) => text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim(),
}))
vi.mock('@/lib/ai-usage/response-cache', () => ({
  buildAiResponseCacheKey: (feature: string, input: unknown) => `${feature}:${JSON.stringify(input)}`,
  getAiResponseCache: async (_feature: string, key: string) => mocks.cache.get(key) ?? null,
  normalizeAiCacheText: (value: string) => value.trim().replace(/\s+/g, ' '),
  setAiResponseCache: async (_feature: string, key: string, payload: unknown) => { mocks.cache.set(key, payload) },
}))
vi.mock('@/lib/ai-usage/budget', () => ({
  recordSharedCacheHit: mocks.recordSharedCacheHit,
}))

import { POST } from '../route'

function reqWith(): Request {
  return new Request('http://x/api/gemini/translate', { method: 'POST', body: '{}' })
}

beforeEach(() => {
  mocks.validateBody.mockReset().mockResolvedValue({ data: { text: '  The   train is late.  ' }, error: null })
  mocks.callWithFallback.mockReset().mockImplementation(async (_key, _params, parse) =>
    parse(JSON.stringify({ translation: 'El tren llega tarde.' }))
  )
  mocks.cache.clear()
  mocks.recordSharedCacheHit.mockReset()
  process.env.GEMINI_API_KEY = 'test'
})

describe('translate response cache', () => {
  it('reuses a validated result for the same normalized text without another Gemini call', async () => {
    const first = await POST(reqWith() as never)
    const second = await POST(reqWith() as never)

    expect(first.status).toBe(200)
    expect(await second.json()).toEqual({ translation: 'El tren llega tarde.' })
    expect(mocks.callWithFallback).toHaveBeenCalledTimes(1)
    expect(mocks.recordSharedCacheHit).toHaveBeenCalledWith('/api/gemini/translate')
  })
})
