import { describe, it, expect } from 'vitest'
import { updateSRS } from '@/lib/srs'
import type { SRSData } from '@/lib/types'

describe('updateSRS preserves the exposure boundary', () => {
  it('leaves the exposure sub-object intact after a grade', () => {
    const before: SRSData = {
      wordId: 'c1k:go', word: 'go', ease: 2.5, interval: 1, repetitions: 0,
      nextReview: new Date().toISOString(), exposure: { lastAt: 123, count: 4 },
    }
    const after = updateSRS(before, 5)
    expect(after.exposure).toEqual({ lastAt: 123, count: 4 })
  })
})
