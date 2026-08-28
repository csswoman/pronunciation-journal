import { describe, it, expect } from 'vitest'
import { buildManualConceptSignal, buildTheoryClaimSignal, CLAIM_VERIFICATION_MS } from '../claims'

describe('buildTheoryClaimSignal and buildManualConceptSignal', () => {
  it('marks review with deferred due and never mastered for legacy claim', () => {
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
    expect(signal.selfRating).toBe('unknown')
    expect(signal.source).toBe('manual')
    expect(signal.correct).toBe(0)
    expect(signal.total).toBe(0)
    expect(signal.verificationDueAt).toBe(
      new Date(Date.parse(now) + CLAIM_VERIFICATION_MS).toISOString(),
    )
  })

  it('builds mastered signal on "Lo tengo"', () => {
    const now = '2026-08-12T12:00:00.000Z'
    const signal = buildManualConceptSignal(
      { lessonSlug: 'verb-to-be', level: 'a1', title: 'To Be' },
      'mastered',
      now,
    )
    expect(signal.status).toBe('mastered')
    expect(signal.selfRating).toBe('confident')
    expect(signal.source).toBe('manual')
    expect(signal.verificationDueAt).toBeUndefined()
  })

  it('builds normal review signal (3 days) on "Más o menos"', () => {
    const now = '2026-08-12T12:00:00.000Z'
    const signal = buildManualConceptSignal(
      { lessonSlug: 'past-simple', level: 'a2', title: 'Past Simple' },
      'so_so',
      now,
    )
    expect(signal.status).toBe('review')
    expect(signal.selfRating).toBe('familiar')
    expect(signal.source).toBe('manual')
    expect(signal.verificationDueAt).toBe(
      new Date(Date.parse(now) + 3 * CLAIM_VERIFICATION_MS).toISOString(),
    )
  })

  it('builds short review signal (tomorrow, 24h) on "Necesito ayuda"', () => {
    const now = '2026-08-12T12:00:00.000Z'
    const signal = buildManualConceptSignal(
      { lessonSlug: 'conditionals', level: 'b1', title: 'Conditionals' },
      'need_help',
      now,
    )
    expect(signal.status).toBe('review')
    expect(signal.selfRating).toBe('unknown')
    expect(signal.source).toBe('manual')
    expect(signal.verificationDueAt).toBe(
      new Date(Date.parse(now) + CLAIM_VERIFICATION_MS).toISOString(),
    )
  })
})
