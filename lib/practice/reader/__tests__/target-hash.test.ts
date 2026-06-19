import { describe, it, expect } from 'vitest'
import { targetHash } from '../target-hash'

describe('targetHash', () => {
  it('is order-independent', () => {
    expect(targetHash(['go', 'cat', 'run'])).toBe(targetHash(['run', 'go', 'cat']))
  })

  it('is case-insensitive', () => {
    expect(targetHash(['Go'])).toBe(targetHash(['go']))
  })

  it('differs for different target sets', () => {
    expect(targetHash(['go', 'cat'])).not.toBe(targetHash(['go', 'dog']))
  })
})
