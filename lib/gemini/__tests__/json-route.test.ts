import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  callWithFallback: vi.fn(),
}))

vi.mock('@/lib/gemini/client', () => ({
  callWithFallback: mocks.callWithFallback,
  getErrorStatus: (error: unknown) =>
    typeof error === 'object' && error !== null && 'status' in error
      ? (error as { status?: number }).status
      : undefined,
  stripJsonFences: (text: string) => text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim(),
}))

vi.mock('@/lib/api/guards', () => ({
  publicErrorResponse: (status: number, message: string) =>
    Response.json({ error: message }, { status }),
  redactError: (error: unknown) => error,
}))

import { parseGeminiJson, respondWithGeminiJson } from '../json-route'

beforeEach(() => {
  mocks.callWithFallback.mockReset()
  process.env.GEMINI_API_KEY = 'test'
})

describe('gemini json-route helpers', () => {
  it('parses fenced Gemini JSON responses', () => {
    const parsed = parseGeminiJson('```json\n{"ok":true}\n```', (json) => json)

    expect(parsed).toEqual({ ok: true })
  })

  it('returns 503 without calling Gemini when the API key is missing', async () => {
    delete process.env.GEMINI_API_KEY

    const res = await respondWithGeminiJson({
      endpoint: '/api/test',
      params: { contents: 'prompt' },
      parse: (text) => ({ text }),
      failureMessage: 'failed',
    })

    expect(res.status).toBe(503)
    expect(mocks.callWithFallback).not.toHaveBeenCalled()
  })

  it('maps provider errors to a sanitized public response', async () => {
    mocks.callWithFallback.mockRejectedValueOnce({ status: 429, message: 'quota exceeded' })

    const res = await respondWithGeminiJson({
      endpoint: '/api/test',
      userId: 'user-1',
      params: { contents: 'prompt' },
      parse: (text) => ({ text }),
      failureMessage: 'failed',
    })
    const body = await res.json()

    expect(res.status).toBe(429)
    expect(body).toEqual({ error: 'failed' })
  })
})
