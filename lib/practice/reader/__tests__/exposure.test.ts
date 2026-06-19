import { describe, it, expect, vi, beforeEach } from 'vitest'

const store = new Map<string, unknown>()
vi.mock('@/lib/db', () => ({
  getSRSData: async (id: string) => store.get(id),
  saveSRSData: async (d: { wordId: string }) => { store.set(d.wordId, d) },
}))

import { recordReaderExposure } from '../exposure'

beforeEach(() => store.clear())

describe('recordReaderExposure', () => {
  it('creates an exposure sub-object on a fresh record', async () => {
    await recordReaderExposure('c1k:go', 'go')
    const rec = store.get('c1k:go') as { exposure: { count: number; lastAt: number } }
    expect(rec.exposure.count).toBe(1)
    expect(rec.exposure.lastAt).toBeGreaterThan(0)
  })

  it('increments count and does not touch SM-2 fields', async () => {
    store.set('c1k:go', {
      wordId: 'c1k:go', word: 'go', ease: 2.5, interval: 7, repetitions: 3,
      nextReview: '2030-01-01T00:00:00.000Z', exposure: { lastAt: 1, count: 2 },
    })
    await recordReaderExposure('c1k:go', 'go')
    const rec = store.get('c1k:go') as {
      exposure: { count: number }; interval: number; repetitions: number; nextReview: string
    }
    expect(rec.exposure.count).toBe(3)
    expect(rec.interval).toBe(7)
    expect(rec.repetitions).toBe(3)
    expect(rec.nextReview).toBe('2030-01-01T00:00:00.000Z')
  })
})
