import { describe, expect, it } from 'vitest'
import { buildTopicStatusByDeck } from '../topic-progress'

describe('buildTopicStatusByDeck', () => {
  it('uses topic_srs as the only status source for curriculum decks', () => {
    const statuses = buildTopicStatusByDeck([
      {
        topic: 'grammar:articles',
        srsStatus: 'mastered',
        nextReviewAt: null,
        lastReviewedAt: '2026-09-01T00:00:00.000Z',
      },
      {
        topic: 'grammar:present simple',
        srsStatus: 'learning',
        nextReviewAt: '2026-09-17T00:00:00.000Z',
        lastReviewedAt: '2026-09-16T00:00:00.000Z',
      },
    ])

    expect(statuses.get('a1-articulos-basicos')).toBe('mastered')
    expect(statuses.get('a1-presente-simple')).toBe('review')
  })

  it('does not infer retention from route completion', () => {
    const statuses = buildTopicStatusByDeck([])
    expect(statuses.get('a1-pronombres-objeto')).toBeUndefined()
  })
})
