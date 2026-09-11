import { describe, it, expect } from 'vitest'
import { toFocusLevel, toProfileCefr } from '../cefr'

describe('toFocusLevel', () => {
  it('accepts the five modelled levels in either case', () => {
    expect(toFocusLevel('a1')).toBe('a1')
    expect(toFocusLevel('B1')).toBe('b1')
    expect(toFocusLevel(' c1 ')).toBe('c1')
  })

  it('folds C2 down to C1 instead of rejecting it', () => {
    expect(toFocusLevel('C2')).toBe('c1')
    expect(toFocusLevel('c2')).toBe('c1')
  })

  it('returns null for missing or unknown values', () => {
    expect(toFocusLevel(null)).toBeNull()
    expect(toFocusLevel(undefined)).toBeNull()
    expect(toFocusLevel('')).toBeNull()
    expect(toFocusLevel('d1')).toBeNull()
  })
})

describe('toProfileCefr', () => {
  it('uppercases the focus level for profile storage', () => {
    expect(toProfileCefr('b2')).toBe('B2')
  })
})
