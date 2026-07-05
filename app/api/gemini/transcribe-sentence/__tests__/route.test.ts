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
}))

import { POST } from '../route'

function reqWith(): Request {
  return new Request('http://x/api/gemini/transcribe-sentence', { method: 'POST', body: '{}' })
}

beforeEach(() => {
  mocks.validateBody.mockReset()
  mocks.callWithFallback.mockReset()
  process.env.GEMINI_API_KEY = 'test'
})

describe('transcribe-sentence route', () => {
  it('transcribes valid audio and caches repeated requests per user and payload', async () => {
    mocks.validateBody.mockResolvedValue({
      data: { audioDataUrl: 'data:audio/webm;base64,ZmFrZQ==' },
      error: null,
    })
    mocks.callWithFallback.mockResolvedValueOnce('hello world')

    const first = await POST(reqWith() as never)
    const second = await POST(reqWith() as never)

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(await first.json()).toEqual({ transcript: 'hello world' })
    expect(await second.json()).toEqual({ transcript: 'hello world' })
    expect(mocks.callWithFallback).toHaveBeenCalledTimes(1)
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
