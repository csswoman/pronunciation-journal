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
  return new Request('http://x/api/gemini/word-search', { method: 'POST', body: '{}' })
}

const validPuzzle = {
  topicTitle: 'Kitchen tools',
  words: [
    {
      word: 'KNIFE',
      ipa: '/naɪf/',
      clue: 'A tool used to cut food',
      meaningEs: 'cuchillo',
      exampleSentence: 'She used a knife to cut the bread.',
    },
    {
      word: 'SPOON',
      ipa: '/spuːn/',
      clue: 'A utensil used to eat soup',
      meaningEs: 'cuchara',
      exampleSentence: 'He stirred the soup with a spoon.',
    },
    {
      word: 'PLATE',
      ipa: '/pleɪt/',
      clue: 'A flat dish for serving food',
      meaningEs: 'plato',
      exampleSentence: 'Put the salad on a plate.',
    },
  ],
}

beforeEach(() => {
  mocks.validateBody.mockReset()
  mocks.callWithFallback.mockReset()
  process.env.GEMINI_API_KEY = 'test'
})

describe('word-search route', () => {
  it('returns a validated word-search puzzle', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { topic: 'kitchen', level: 'intermediate', count: 6 },
      error: null,
    })
    mocks.callWithFallback.mockImplementationOnce(async (_key, _params, parse) =>
      parse(JSON.stringify(validPuzzle))
    )

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.topicTitle).toBe('Kitchen tools')
    expect(body.words).toHaveLength(3)
  })

  it('rejects malformed AI payloads through the response schema', async () => {
    mocks.validateBody.mockResolvedValueOnce({
      data: { topic: 'kitchen', level: 'intermediate', count: 6 },
      error: null,
    })
    mocks.callWithFallback.mockImplementationOnce(async (_key, _params, parse) =>
      parse(JSON.stringify({ topicTitle: 'Kitchen', words: [] }))
    )

    const res = await POST(reqWith() as never)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('No se pudo generar la búsqueda de palabras con IA')
  })
})
