import { describe, it, expect } from 'vitest'
import { buildCoachPrefill } from '../coach-prefill'

describe('buildCoachPrefill', () => {
  it('seeds with session words when present (capped at 6)', () => {
    const out = buildCoachPrefill({
      soundIpa: null,
      topicLabel: 'Food',
      sessionWords: ['order', 'menu', 'waiter', 'bill', 'table', 'tip', 'extra'],
    })
    expect(out).toContain('order, menu, waiter, bill, table, tip')
    expect(out).not.toContain('extra')
    expect(out.toLowerCase()).toContain("today's words")
  })

  it('falls back to topic when there are no words', () => {
    const out = buildCoachPrefill({
      soundIpa: null,
      topicLabel: 'Travel',
      sessionWords: [],
    })
    expect(out).toContain('Travel')
  })

  it('returns empty string when arc is undefined', () => {
    expect(buildCoachPrefill(undefined)).toBe('')
  })

  it('returns empty string when arc has no words and no topic', () => {
    expect(
      buildCoachPrefill({ soundIpa: null, topicLabel: null, sessionWords: [] }),
    ).toBe('')
  })
})
