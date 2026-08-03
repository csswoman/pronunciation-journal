import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireSameOrigin: vi.fn(() => null as unknown),
  requireUser: vi.fn(async () => ({ user: { id: 'u1' }, error: null }) as unknown),
  rateLimit: vi.fn(async () => ({ limited: false, error: null }) as unknown),
  validateBody: vi.fn(),
  callGeminiJson: vi.fn(),
}))

vi.mock('@/lib/api/guards', () => ({
  requireSameOrigin: mocks.requireSameOrigin,
  requireUser: mocks.requireUser,
  rateLimit: mocks.rateLimit,
  validateBody: mocks.validateBody,
}))

vi.mock('@/lib/gemini/json-route', () => ({
  callGeminiJson: mocks.callGeminiJson,
  parseGeminiJson: (raw: unknown) => raw,
}))

import { POST } from '../route'

const body = {
  prompt: 'Write about a place that helps you relax.',
  partial_text: 'My room is quiet.',
  cefr_level: 'A1' as const,
  unused_seed_words: ['cozy', 'blanket'],
  target_length: 60,
}

function request(): Request {
  return new Request('http://x/api/gemini/journal-nudge', {
    method: 'POST',
    headers: { origin: 'http://x' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mocks.requireSameOrigin.mockReturnValue(null)
  mocks.requireUser.mockResolvedValue({ user: { id: 'u1' }, error: null })
  mocks.rateLimit.mockResolvedValue({ limited: false, error: null })
  mocks.validateBody.mockReset()
  mocks.callGeminiJson.mockReset()
})

describe('journal-nudge route', () => {
  it('blocks cross-site requests before validation', async () => {
    mocks.requireSameOrigin.mockReturnValueOnce(Response.json({ error: 'Cross-site request blocked' }, { status: 403 }))

    const response = await POST(request() as never)

    expect(response.status).toBe(403)
    expect(mocks.validateBody).not.toHaveBeenCalled()
  })

  it('requires authentication', async () => {
    mocks.requireUser.mockResolvedValueOnce({ user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) })

    const response = await POST(request() as never)

    expect(response.status).toBe(401)
    expect(mocks.callGeminiJson).not.toHaveBeenCalled()
  })

  it('validates the request before calling Gemini', async () => {
    mocks.validateBody.mockResolvedValueOnce({ error: Response.json({ error: 'Invalid request' }, { status: 400 }) })

    const response = await POST(request() as never)

    expect(response.status).toBe(400)
    expect(mocks.callGeminiJson).not.toHaveBeenCalled()
  })

  it('returns exactly the validated three nudges', async () => {
    mocks.validateBody.mockResolvedValueOnce({ data: body, error: null })
    const nudges = [
      { en: 'What do you do there?', es: '¿Qué haces allí?' },
      { en: 'Is it quiet or noisy?', es: '¿Es silencioso o ruidoso?' },
      { en: 'One detail I like is...', es: 'Un detalle que me gusta es...' },
    ]
    mocks.callGeminiJson.mockResolvedValueOnce({ data: { nudges }, response: null })

    const response = await POST(request() as never)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result).toEqual({ nudges })
    expect(mocks.callGeminiJson).toHaveBeenCalledWith(expect.objectContaining({ endpoint: '/api/gemini/journal-nudge' }))
  })

  it('passes through the standard Gemini degradation response', async () => {
    mocks.validateBody.mockResolvedValueOnce({ data: body, error: null })
    mocks.callGeminiJson.mockResolvedValueOnce({ data: null, response: Response.json({ error: 'AI service unavailable' }, { status: 503 }) })

    const response = await POST(request() as never)

    expect(response.status).toBe(503)
  })
})
