import { describe, it, expect } from 'vitest'
import { decideVowelContrastVerdict, SHIP_AGREEMENT_THRESHOLD } from '../decision-thresholds'

describe('decideVowelContrastVerdict', () => {
  it('ships a contrast at or above the agreement threshold', () => {
    expect(decideVowelContrastVerdict(SHIP_AGREEMENT_THRESHOLD)).toBe('ship')
    expect(decideVowelContrastVerdict(0.95)).toBe('ship')
  })

  it('does not ship a contrast below the agreement threshold', () => {
    expect(decideVowelContrastVerdict(SHIP_AGREEMENT_THRESHOLD - 0.01)).toBe('no_ship')
    expect(decideVowelContrastVerdict(0.5)).toBe('no_ship')
  })
})
