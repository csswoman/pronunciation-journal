import { describe, it, expect } from 'vitest'
import { buildTheoryClaimSignal, CLAIM_VERIFICATION_MS } from '../claims'

describe('buildTheoryClaimSignal', () => {
  it('marks review with deferred due and never mastered', () => {
    const now = '2026-08-12T12:00:00.000Z'
    const signal = buildTheoryClaimSignal(
      {
        lessonSlug: 'articles-a-an-the',
        level: 'a1',
        title: 'Artículos',
      },
      now,
    )
    expect(signal.status).toBe('review')
    expect(signal.selfRating).toBe('familiar')
    expect(signal.correct).toBe(0)
    expect(signal.total).toBe(0)
    expect(signal.verificationDueAt).toBe(
      new Date(Date.parse(now) + CLAIM_VERIFICATION_MS).toISOString(),
    )
  })
})
