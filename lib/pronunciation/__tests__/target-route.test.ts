import { describe, expect, it } from 'vitest'
import { soundLabFocusHref, targetIdToPracticeRoute } from '../target-route'

describe('soundLabFocusHref', () => {
  it('builds a focus query from IPA tokens', () => {
    expect(soundLabFocusHref(['/iː/', '/ɪ/'])).toBe(
      `/practice/sounds?focus=${encodeURIComponent('iː,ɪ')}`
    )
  })

  it('falls back to the lab index when tokens are empty', () => {
    expect(soundLabFocusHref([])).toBe('/practice/sounds')
  })
})

describe('targetIdToPracticeRoute', () => {
  it('routes segmental.phoneme targets to a focused sound lab view', () => {
    expect(targetIdToPracticeRoute('segmental.phoneme./ə/')).toBe(
      `/practice/sounds?focus=${encodeURIComponent('ə')}`
    )
  })

  it('routes segmental.contrast targets to a focused sound lab view', () => {
    expect(targetIdToPracticeRoute('segmental.contrast.θ|ð')).toBe(
      `/practice/sounds?focus=${encodeURIComponent('θ,ð')}`
    )
    expect(targetIdToPracticeRoute('segmental.contrast./iː/|/ɪ/')).toBe(
      `/practice/sounds?focus=${encodeURIComponent('iː,ɪ')}`
    )
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
