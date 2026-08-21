import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireSameOrigin: vi.fn(() => null as unknown),
  requireUser: vi.fn(async () => ({ user: { id: 'u1' }, error: null }) as unknown),
  rateLimit: vi.fn(async () => ({ limited: false, error: null }) as unknown),
  validateBody: vi.fn(),
  callGeminiJson: vi.fn(),
  applyJournalFeedback: vi.fn(),
  maybeSingle: vi.fn(),
}))

vi.mock('@/lib/api/guards', () => ({
  requireSameOrigin: mocks.requireSameOrigin,
  requireUser: mocks.requireUser,
  checkLayeredRateLimit: mocks.rateLimit,
  rateLimit: mocks.rateLimit,
  validateBody: mocks.validateBody,
}))

vi.mock('@/lib/gemini/json-route', () => ({
  callGeminiJson: mocks.callGeminiJson,
  parseGeminiJson: (raw: unknown) => raw,
}))

vi.mock('@/lib/users/server-queries', () => ({
  getUserInterests: async () => [],
}))

vi.mock('@/lib/journal/apply-feedback', () => ({
  applyJournalFeedback: mocks.applyJournalFeedback,
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({
    from: () => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: mocks.maybeSingle,
      }
      return builder
    },
  }),
}))

import { POST } from '../route'

const validEntryId = '11111111-1111-4111-8111-111111111111'

function reqWith(): Request {
  return new Request('http://x/api/gemini/journal-correct', {
    method: 'POST',
    headers: { origin: 'http://x' },
    body: JSON.stringify({ entryId: validEntryId, content: 'Yesterday I go to work.' }),
  })
}

function goodBody() {
  return { data: { entryId: validEntryId, content: 'Yesterday I go to work.' }, error: null }
}

const geminiResult = {
  data: { correctedContent: 'Yesterday I went to work.', errors: [], newWords: [] },
  response: null,
}

beforeEach(() => {
  mocks.requireSameOrigin.mockReturnValue(null)
  mocks.requireUser.mockResolvedValue({ user: { id: 'u1' }, error: null })
  mocks.rateLimit.mockResolvedValue({ limited: false, error: null })
  mocks.validateBody.mockReset()
  mocks.callGeminiJson.mockReset()
  mocks.applyJournalFeedback.mockReset()
  mocks.maybeSingle.mockReset()
  process.env.GEMINI_API_KEY = 'test'
})

describe('journal-correct route', () => {
  it('blocks cross-site requests before doing any work', async () => {
    mocks.requireSameOrigin.mockReturnValueOnce(Response.json({ error: 'Cross-site request blocked' }, { status: 403 }))

    const res = await POST(reqWith() as never)

    expect(res.status).toBe(403)
    expect(mocks.validateBody).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated requests', async () => {
    mocks.requireUser.mockResolvedValueOnce({ user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) })

    const res = await POST(reqWith() as never)

    expect(res.status).toBe(401)
    expect(mocks.callGeminiJson).not.toHaveBeenCalled()
  })

  it('returns 404 for a missing or foreign entry', async () => {
    mocks.validateBody.mockResolvedValueOnce(goodBody())
    mocks.maybeSingle.mockResolvedValueOnce({ data: null, error: null })

    const res = await POST(reqWith() as never)

    expect(res.status).toBe(404)
    expect(mocks.callGeminiJson).not.toHaveBeenCalled()
  })

  it('rejects a draft entry with 409', async () => {
    mocks.validateBody.mockResolvedValueOnce(goodBody())
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: validEntryId, status: 'draft' }, error: null })

    const res = await POST(reqWith() as never)

    expect(res.status).toBe(409)
    expect(mocks.callGeminiJson).not.toHaveBeenCalled()
  })

  it('rejects an already corrected entry with 409', async () => {
    mocks.validateBody.mockResolvedValueOnce(goodBody())
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: validEntryId, status: 'corrected' }, error: null })

    const res = await POST(reqWith() as never)

    expect(res.status).toBe(409)
  })

  it('surfaces the Gemini degradation response without persisting', async () => {
    mocks.validateBody.mockResolvedValueOnce(goodBody())
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: validEntryId, status: 'submitted' }, error: null })
    mocks.callGeminiJson.mockResolvedValueOnce({ data: null, response: Response.json({ error: 'AI service unavailable' }, { status: 503 }) })

    const res = await POST(reqWith() as never)

    expect(res.status).toBe(503)
    expect(mocks.applyJournalFeedback).not.toHaveBeenCalled()
  })

  it('corrects a submitted entry and returns the feedback', async () => {
    mocks.validateBody.mockResolvedValueOnce(goodBody())
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: validEntryId, status: 'submitted' }, error: null })
    mocks.callGeminiJson.mockResolvedValueOnce(geminiResult)
    mocks.applyJournalFeedback.mockResolvedValueOnce({ applied: true, scheduledTopics: [] })

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.correctedContent).toBe('Yesterday I went to work.')
    expect(body.scheduled).toEqual({ topics: [], words: [] })
  })

  it('returns every topic date captured while scheduling the correction', async () => {
    mocks.validateBody.mockResolvedValueOnce(goodBody())
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: validEntryId, status: 'submitted' }, error: null })
    mocks.callGeminiJson.mockResolvedValueOnce(geminiResult)
    const scheduledTopics = [
      { topicId: 'grammar:past simple', nextReviewAt: '2026-08-03T09:00:00.000Z', intervalDays: 1 },
      { topicId: 'grammar:articles', nextReviewAt: '2026-08-06T09:00:00.000Z', intervalDays: 4 },
    ]
    mocks.applyJournalFeedback.mockResolvedValueOnce({ applied: true, scheduledTopics })

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.scheduled.topics).toEqual(scheduledTopics)
    expect(body.scheduled.words).toEqual([])
  })

  it('returns 409 when a concurrent request already corrected the entry (idempotent)', async () => {
    mocks.validateBody.mockResolvedValueOnce(goodBody())
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: validEntryId, status: 'submitted' }, error: null })
    mocks.callGeminiJson.mockResolvedValueOnce(geminiResult)
    mocks.applyJournalFeedback.mockResolvedValueOnce({ applied: false, reason: 'not_submitted' })

    const res = await POST(reqWith() as never)

    expect(res.status).toBe(409)
  })

  it('returns 500 when persistence fails', async () => {
    mocks.validateBody.mockResolvedValueOnce(goodBody())
    mocks.maybeSingle.mockResolvedValueOnce({ data: { id: validEntryId, status: 'submitted' }, error: null })
    mocks.callGeminiJson.mockResolvedValueOnce(geminiResult)
    mocks.applyJournalFeedback.mockRejectedValueOnce(new Error('db down'))

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Failed to save journal correction')
  })
})
