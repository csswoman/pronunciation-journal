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

  it('differs when the level changes for the same target set', () => {
    expect(targetHash(['go', 'cat'], 'B1')).not.toBe(targetHash(['go', 'cat'], 'B2'))
  })

  it('is level-case-insensitive and preserves the no-level hash', () => {
    expect(targetHash(['go'], 'B1')).toBe(targetHash(['go'], 'b1'))
    expect(targetHash(['go'], 'B1')).not.toBe(targetHash(['go']))
  })
})
