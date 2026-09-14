import { describe, it, expect } from 'vitest'
import { pickTargets } from '../select-targets'

const row = (word: string, status: string, due: string, difficulty?: number) => ({
  srsId: `c1k:${word}`, word, status, nextReview: due, difficulty,
})

describe('pickTargets', () => {
  it('returns null when fewer than 3 qualify', () => {
    expect(pickTargets([row('go', 'learning', '2030-01-01', 3), row('cat', 'new', '2030-01-01', 3)])).toBeNull()
  })

  it('keeps only learning/review and orders by soonest due', () => {
    const out = pickTargets([
      row('go', 'learning', '2030-03-01', 3),
      row('cat', 'review', '2030-01-01', 3),
      row('dog', 'mastered', '2030-01-01', 3),
      row('run', 'learning', '2030-02-01', 3),
    ])
    expect(out?.map((t) => t.word)).toEqual(['cat', 'run', 'go'])
  })

  it('orders real due dates before rows without a review date', () => {
    const out = pickTargets([
      row('undated', 'review', '', 3),
      row('later', 'learning', '2030-02-01', 3),
      row('due', 'review', '2030-01-01', 3),
    ])
    expect(out?.map((t) => t.word)).toEqual(['due', 'later', 'undated'])
  })

  it('caps at 8 targets', () => {
    const rows = Array.from({ length: 12 }, (_, i) => row(`w${i}`, 'review', `2030-01-${i + 1}`, 3))
    expect(pickTargets(rows)?.length).toBe(8)
  })

  describe('vocabulary safety gate', () => {
    it('excludes unvetted words (difficulty 0/undefined) when no learner level is known', () => {
      const out = pickTargets([
        row('asynchronous', 'review', '2030-01-01'), // no difficulty
        row('bundle', 'review', '2030-01-02', 0),
        row('cat', 'review', '2030-01-03', 1),
        row('dog', 'learning', '2030-01-04', 1),
        row('run', 'learning', '2030-01-05', 1),
      ])
      expect(out?.map((t) => t.word)).toEqual(['cat', 'dog', 'run'])
    })

    it('excludes unvetted words at A1/A2', () => {
      const out = pickTargets(
        [
          row('asynchronous', 'review', '2030-01-01'),
          row('cat', 'review', '2030-01-02', 1),
          row('dog', 'learning', '2030-01-03', 1),
          row('run', 'learning', '2030-01-04', 1),
        ],
        'A1',
      )
      expect(out?.map((t) => t.word)).toEqual(['cat', 'dog', 'run'])
    })

    it('allows unvetted words at B1 and above', () => {
      const out = pickTargets(
        [
          row('asynchronous', 'review', '2030-01-01'),
          row('bundle', 'review', '2030-01-02'),
          row('cat', 'review', '2030-01-03'),
        ],
        'B1',
      )
      expect(out?.map((t) => t.word)).toEqual(['asynchronous', 'bundle', 'cat'])
    })

    it('always keeps vetted words regardless of level', () => {
      const out = pickTargets(
        [
          row('cat', 'review', '2030-01-01', 1),
          row('dog', 'review', '2030-01-02', 1),
          row('run', 'review', '2030-01-03', 1),
        ],
        'A1',
      )
      expect(out?.map((t) => t.word)).toEqual(['cat', 'dog', 'run'])
    })
  })
})
