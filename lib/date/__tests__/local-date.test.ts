import { describe, expect, it } from 'vitest'
import { getRelativeLocalDateKey, toLocalDateKey } from '../local-date'

describe('local-date helpers', () => {
  it('formats a date with the local calendar day', () => {
    expect(toLocalDateKey(new Date(2026, 5, 21, 23, 15, 0))).toBe('2026-06-21')
  })

  it('derives relative days without switching to UTC math', () => {
    const base = new Date(2026, 0, 1, 22, 0, 0)
    expect(getRelativeLocalDateKey(-1, base)).toBe('2025-12-31')
    expect(getRelativeLocalDateKey(1, base)).toBe('2026-01-02')
  })
})
