import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  TOPIC_DECK_MAP,
  deckSlugForTopic,
  deckSlugForWeakTopics,
  WEAK_TOPIC_MIN_ERROR_RATE,
  WEAK_TOPIC_MIN_SAMPLES,
} from '@/lib/practice/topic-decks'

const DECKS_DIR = path.join(process.cwd(), 'public', 'grammar-decks')

describe('TOPIC_DECK_MAP coverage', () => {
  it('covers the B1 structures the learner is missing', () => {
    const required = [
      'present perfect',
      'conditional',
      'modal',
      'passive',
      'gerund',
      'reported speech',
      'phrasal verb',
      'relative clause',
      'used to',
      'connector',
    ]
    for (const keyword of required) {
      expect(deckSlugForTopic(keyword), `no deck for "${keyword}"`).not.toBeNull()
    }
  })

  it('points every mapping at a deck file that exists', () => {
    for (const { keyword, deckSlug } of TOPIC_DECK_MAP) {
      const file = path.join(DECKS_DIR, `${deckSlug}.json`)
      expect(fs.existsSync(file), `${keyword} → missing deck ${deckSlug}.json`).toBe(true)
    }
  })

  it('has no duplicate keywords', () => {
    const keywords = TOPIC_DECK_MAP.map((e) => e.keyword)
    expect(new Set(keywords).size).toBe(keywords.length)
  })

  it('resolves more specific keywords before the generic ones they contain', () => {
    expect(deckSlugForTopic('present perfect continuous')).toBe('b1-presente-perfecto-continuo')
  })
})

describe('weak topic thresholds', () => {
  it('triggers on a moderate error rate, not only a severe one', () => {
    expect(WEAK_TOPIC_MIN_ERROR_RATE).toBeLessThanOrEqual(0.25)
    expect(WEAK_TOPIC_MIN_SAMPLES).toBeLessThanOrEqual(2)
  })

  it('selects a deck for a topic with 2 samples at 0.3 error rate', () => {
    const slug = deckSlugForWeakTopics([
      { topic: 'present perfect', errorRate: 0.3, sampleCount: 2 },
    ])
    expect(slug).not.toBeNull()
  })

  it('ignores topics with no evidence at all', () => {
    expect(deckSlugForWeakTopics([])).toBeNull()
    expect(
      deckSlugForWeakTopics([{ topic: 'present perfect', errorRate: 0, sampleCount: 5 }]),
    ).toBeNull()
  })
})
