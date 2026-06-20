import { describe, it, expect } from 'vitest'
import { pickTargets } from '../select-targets'

const row = (word: string, status: string, due: string) => ({
  srsId: `c1k:${word}`, word, status, nextReview: due,
})

describe('pickTargets', () => {
  it('returns null when fewer than 3 qualify', () => {
    expect(pickTargets([row('go', 'learning', '2030-01-01'), row('cat', 'new', '2030-01-01')])).toBeNull()
  })

  it('keeps only learning/review and orders by soonest due', () => {
    const out = pickTargets([
      row('go', 'learning', '2030-03-01'),
      row('cat', 'review', '2030-01-01'),
      row('dog', 'mastered', '2030-01-01'),
      row('run', 'learning', '2030-02-01'),
    ])
    expect(out?.map((t) => t.word)).toEqual(['cat', 'run', 'go'])
  })

  it('caps at 8 targets', () => {
    const rows = Array.from({ length: 12 }, (_, i) => row(`w${i}`, 'review', `2030-01-${i + 1}`))
    expect(pickTargets(rows)?.length).toBe(8)
  })
})
