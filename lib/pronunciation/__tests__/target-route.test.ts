import { describe, expect, it } from 'vitest'
import { targetIdToPracticeRoute } from '../target-route'

describe('targetIdToPracticeRoute', () => {
  it('routes segmental.phoneme targets to the sound lab', () => {
    expect(targetIdToPracticeRoute('segmental.phoneme./ə/')).toBe('/practice/sounds')
  })

  it('routes segmental.contrast targets to the sound lab', () => {
    expect(targetIdToPracticeRoute('segmental.contrast.θ|ð')).toBe('/practice/sounds')
  })

  it('returns null for prosody targets (no dedicated route)', () => {
    expect(targetIdToPracticeRoute('prosody.word-stress')).toBeNull()
  })

  it('returns null for connected-speech targets (no dedicated route)', () => {
    expect(targetIdToPracticeRoute('connected.linking')).toBeNull()
  })

  it('returns null for unknown target id shapes', () => {
    expect(targetIdToPracticeRoute('unknown.category.foo')).toBeNull()
  })
})
