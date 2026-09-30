import { describe, expect, it } from 'vitest'
import { applyReviewFilters, soundDaysOverdue, topicDaysOverdue, wordDaysOverdue } from '../filters'

describe('wordDaysOverdue', () => {
  it('returns 0 for a word without next_review_at', () => {
    expect(wordDaysOverdue({ next_review_at: null })).toBe(0)
  })

  it('computes real days overdue from next_review_at', () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 86_400_000).toISOString()
    expect(wordDaysOverdue({ next_review_at: fourDaysAgo })).toBeGreaterThanOrEqual(3)
  })

  it('returns 0 for a future date, never a negative number', () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString()
    expect(wordDaysOverdue({ next_review_at: tomorrow })).toBe(0)
  })
})

describe('topicDaysOverdue', () => {
  it('mirrors word overdue logic for topic_srs rows', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString()
    expect(topicDaysOverdue({ next_review_at: twoDaysAgo })).toBeGreaterThanOrEqual(1)
  })
})

describe('soundDaysOverdue', () => {
  it('passes through the server-computed value unchanged', () => {
    expect(soundDaysOverdue({ daysOverdue: 12 })).toBe(12)
  })
})

describe('applyReviewFilters', () => {
  const items = [
    { id: 'a', days: 0 },
    { id: 'b', days: 5 },
    { id: 'c', days: 2 },
  ]
  const getDays = (item: { days: number }) => item.days

  it('returns all items unmodified when both toggles are off', () => {
    const result = applyReviewFilters(items, getDays, { sortByOverdue: false, onlyOverdue: false })
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('drops items with zero days overdue when onlyOverdue is on', () => {
    const result = applyReviewFilters(items, getDays, { sortByOverdue: false, onlyOverdue: true })
    expect(result.map((i) => i.id)).toEqual(['b', 'c'])
  })

  it('sorts descending by real days overdue when sortByOverdue is on', () => {
    const result = applyReviewFilters(items, getDays, { sortByOverdue: true, onlyOverdue: false })
    expect(result.map((i) => i.id)).toEqual(['b', 'c', 'a'])
  })

  it('combines both filters', () => {
    const result = applyReviewFilters(items, getDays, { sortByOverdue: true, onlyOverdue: true })
    expect(result.map((i) => i.id)).toEqual(['b', 'c'])
  })

  it('never mutates the original array', () => {
    const original = [...items]
    applyReviewFilters(items, getDays, { sortByOverdue: true, onlyOverdue: true })
    expect(items).toEqual(original)
  })
})
