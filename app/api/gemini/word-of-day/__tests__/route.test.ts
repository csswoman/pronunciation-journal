import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getWordOfDay: vi.fn(),
}))

vi.mock('@/lib/word-of-day', () => ({
  getWordOfDay: mocks.getWordOfDay,
}))

vi.mock('@/lib/api/guards', () => ({
  redactError: (error: unknown) => error,
}))

import { GET } from '../route'

beforeEach(() => {
  mocks.getWordOfDay.mockReset()
})

describe('word-of-day route', () => {
  it('returns the generated word with public cache headers by default', async () => {
    mocks.getWordOfDay.mockResolvedValueOnce({ word: 'focus', definition: 'attention' })

    const res = await GET(new Request('http://x/api/gemini/word-of-day') as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600')
    expect(body.word).toBe('focus')
    expect(mocks.getWordOfDay).toHaveBeenCalledWith({ forceRefresh: false, level: undefined })
  })

  it('passes a valid CEFR level through to the generator', async () => {
    mocks.getWordOfDay.mockResolvedValueOnce({ word: 'ephemeral', definition: 'lasting briefly' })

    const res = await GET(new Request('http://x/api/gemini/word-of-day?level=C1') as never)
    await res.json()

    expect(mocks.getWordOfDay).toHaveBeenCalledWith({ forceRefresh: false, level: 'C1' })
  })

  it('ignores an invalid level param', async () => {
    mocks.getWordOfDay.mockResolvedValueOnce({ word: 'focus', definition: 'attention' })

    await GET(new Request('http://x/api/gemini/word-of-day?level=Z9') as never)

    expect(mocks.getWordOfDay).toHaveBeenCalledWith({ forceRefresh: false, level: undefined })
  })

  it('returns the static fallback when refresh and fallback generation fail', async () => {
    mocks.getWordOfDay
      .mockRejectedValueOnce(new Error('primary failed'))
      .mockRejectedValueOnce(new Error('fallback failed'))

    const res = await GET(new Request('http://x/api/gemini/word-of-day?refresh=1') as never)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(body.word).toBe('clarity')
    expect(mocks.getWordOfDay).toHaveBeenCalledTimes(2)
  })
})
