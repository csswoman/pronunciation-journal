import { describe, it, expect, vi, beforeEach } from 'vitest'

const generateContent = vi.fn()
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent }
  },
}))
vi.mock('@/lib/api/guards', () => ({
  requireUser: async () => ({ user: { id: 'u1' }, error: null }),
  rateLimit: () => ({ limited: false, error: null }),
  validateBody: async (_req: Request, _schema: unknown) => ({
    data: { targets: ['cat', 'go', 'dog'], level: 'b1' }, error: null,
  }),
}))

import { POST } from '../route'

function reqWith(): Request {
  return new Request('http://x', { method: 'POST', body: '{}' })
}

beforeEach(() => {
  generateContent.mockReset()
  process.env.GEMINI_API_KEY = 'test'
})

describe('generate-reader route', () => {
  it('returns a passage when refinement passes', async () => {
    generateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        passage: 'The cat went to find a dog in the park.',
        topic: 'animals',
        questions: [{ prompt: 'Who did the cat find?', options: ['dog', 'fish', 'bird', 'cow'], correctIndex: 0 }],
      }),
    })
    const res = await POST(reqWith() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.passage).toContain('cat')
  })

  it('retries the next model when the passage misses too many targets', async () => {
    generateContent
      .mockResolvedValueOnce({ text: JSON.stringify({
        passage: 'Nothing relevant here at all.', topic: 't',
        questions: [{ prompt: 'q', options: ['a', 'b', 'c', 'd'], correctIndex: 0 }],
      }) })
      .mockResolvedValueOnce({ text: JSON.stringify({
        passage: 'The cat went with the dog.', topic: 'animals',
        questions: [{ prompt: 'q', options: ['a', 'b', 'c', 'd'], correctIndex: 0 }],
      }) })
    const res = await POST(reqWith() as never)
    expect(res.status).toBe(200)
    expect(generateContent).toHaveBeenCalledTimes(2)
  })
})
