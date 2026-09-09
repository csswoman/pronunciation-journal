import { describe, it, expect } from 'vitest'
import { splitLimitByLevel } from '../../../scripts/sync-engvid-lessons'
import { IMMERSION_LEVELS } from '../scrape'

describe('splitLimitByLevel', () => {
  it('divides the budget evenly when it fits', () => {
    const quota = splitLimitByLevel(30, IMMERSION_LEVELS)
    expect([...quota.values()]).toEqual([10, 10, 10])
  })

  it('spends the whole budget when it does not divide evenly', () => {
    const quota = splitLimitByLevel(10, IMMERSION_LEVELS)
    const shares = [...quota.values()]
    expect(shares.reduce((a, b) => a + b, 0)).toBe(10)
    expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1)
  })

  it('leaves later levels empty when the budget is smaller than the level count', () => {
    const quota = splitLimitByLevel(2, IMMERSION_LEVELS)
    expect([...quota.values()].reduce((a, b) => a + b, 0)).toBe(2)
    expect(quota.get('C1')).toBe(0)
  })
})
