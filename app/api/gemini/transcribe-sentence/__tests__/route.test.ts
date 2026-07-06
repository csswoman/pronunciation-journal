import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  validateBody: vi.fn(),
  callWithFallback: vi.fn(),
  from: vi.fn(),
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
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ from: mocks.from }),
}))

import { POST } from '../route'

function reqWith(): Request {
  return new Request('http://x/api/gemini/transcribe-sentence', { method: 'POST', body: '{}' })
}

function mockL2Miss() {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const selectQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle,
  }
  const upsertQuery = {
    upsert,
  }
  mocks.from
    .mockReturnValueOnce(selectQuery)
    .mockReturnValueOnce(upsertQuery)
  return { maybeSingle, upsert, selectQuery }
}

function mockL2Hit(transcript: string) {
  const selectQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { transcript, updated_at: new Date().toISOString() },
      error: null,
    }),
  }
  mocks.from.mockReturnValueOnce(selectQuery)
  return { selectQuery }
}

beforeEach(() => {
  mocks.validateBody.mockReset()
  mocks.callWithFallback.mockReset()
  mocks.from.mockReset()
  process.env.GEMINI_API_KEY = 'test'
})

describe('transcribe-sentence route', () => {
  it('transcribes valid audio and caches repeated requests per user and payload', async () => {
    mocks.validateBody.mockResolvedValue({
      data: { audioDataUrl: 'data:audio/webm;base64,ZmFrZQ==' },
      error: null,
    })
    mocks.callWithFallback.mockResolvedValueOnce('hello world')
    const { upsert } = mockL2Miss()

    const first = await POST(reqWith() as never)
    const second = await POST(reqWith() as never)

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(await first.json()).toEqual({ transcript: 'hello world' })
    expect(await second.json()).toEqual({ transcript: 'hello world', cached: true })
    expect(mocks.callWithFallback).toHaveBeenCalledTimes(1)
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'u1',
        mime_type: 'audio/webm',
        transcript: 'hello world',
      }),
      { onConflict: 'user_id,cache_key' }
    )
  })

  it('returns a fresh Supabase cache hit before calling Gemini', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { audioDataUrl: 'data:audio/ogg;base64,bDItaGl0' },
      error: null,
    })
    const { selectQuery } = mockL2Hit('cached sentence')

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ transcript: 'cached sentence', cached: true, source: 'supabase' })
    expect(selectQuery.eq).toHaveBeenNthCalledWith(1, 'user_id', 'u1')
    expect(selectQuery.eq).toHaveBeenNthCalledWith(2, 'cache_key', expect.any(String))
    expect(mocks.callWithFallback).not.toHaveBeenCalled()
  })

  it('rejects unsupported audio data URL formats', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { audioDataUrl: 'data:audio/x-custom;base64,ZmFrZQ==' },
      error: null,
    })

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to transcribe sentence')
    expect(mocks.callWithFallback).not.toHaveBeenCalled()
  })
})
