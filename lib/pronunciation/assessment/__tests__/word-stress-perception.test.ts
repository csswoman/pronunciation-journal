import { describe, expect, it } from 'vitest'
import {
  WORD_STRESS_PERCEPTION_ITEMS,
  WORD_STRESS_ITEMS_PER_RUN,
  sampleWordStressItems,
  wordStressScore,
  wordStressCorrectAnswers,
} from '../word-stress-perception'

describe('word-stress bank', () => {
  it('has enough items to sample from without always repeating', () => {
    expect(WORD_STRESS_PERCEPTION_ITEMS.length).toBeGreaterThanOrEqual(15)
  })

  it('every item has a stressed index within its syllable range', () => {
    for (const item of WORD_STRESS_PERCEPTION_ITEMS) {
      expect(item.stressedSyllableIndex).toBeGreaterThanOrEqual(0)
      expect(item.stressedSyllableIndex).toBeLessThan(item.syllables.length)
    }
  })
})

describe('sampleWordStressItems', () => {
  it('returns exactly WORD_STRESS_ITEMS_PER_RUN items', () => {
    const items = sampleWordStressItems('seed-a', WORD_STRESS_ITEMS_PER_RUN)
    expect(items).toHaveLength(WORD_STRESS_ITEMS_PER_RUN)
  })

  it('returns no duplicates', () => {
    const items = sampleWordStressItems('seed-a', WORD_STRESS_ITEMS_PER_RUN)
    const words = items.map((i) => i.word)
    expect(new Set(words).size).toBe(words.length)
  })

  it('is deterministic for the same seed', () => {
    const a = sampleWordStressItems('seed-a', 5).map((i) => i.word)
    const b = sampleWordStressItems('seed-a', 5).map((i) => i.word)
    expect(a).toEqual(b)
  })

  it('varies across different seeds', () => {
    const a = sampleWordStressItems('seed-a', 5).map((i) => i.word)
    const b = sampleWordStressItems('seed-b', 5).map((i) => i.word)
    expect(a).not.toEqual(b)
  })
})

describe('wordStressScore with explicit total', () => {
  it('scores against the number of items actually presented, not the bank size', () => {
    // 3 of 5 correct in a 5-item run = 60
    expect(wordStressScore(3, 5)).toBe(60)
  })

  it('round-trips correct-answer count for a given run size', () => {
    expect(wordStressCorrectAnswers(60, 5)).toBe(3)
  })

  it('clamps out-of-range correct counts to the run total', () => {
    expect(wordStressScore(9, 5)).toBe(100)
    expect(wordStressScore(-1, 5)).toBe(0)
  })
})
