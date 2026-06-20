import { describe, it, expect } from 'vitest'
import { resolveRecommendedMode, PRACTICE_MODES } from '../practice-modes'

describe('resolveRecommendedMode', () => {
  it('from daily with a sound → sound lab, with custom copy', () => {
    const r = resolveRecommendedMode({
      fromDaily: true,
      arc: { soundIpa: 'æ', topicLabel: null, sessionWords: [] },
      lastModeId: null,
    })
    expect(r.mode.id).toBe('sounds')
    expect(r.reason).toBe('daily-sound')
    expect(r.headline).toContain('/æ/')
  })

  it('from daily without a sound → essential words', () => {
    const r = resolveRecommendedMode({
      fromDaily: true,
      arc: { soundIpa: null, topicLabel: 'Food', sessionWords: [] },
      lastModeId: null,
    })
    expect(r.mode.id).toBe('core-1000')
    expect(r.reason).toBe('daily-words')
  })

  it('not from daily, last mode known → continue that mode', () => {
    const r = resolveRecommendedMode({
      fromDaily: false,
      arc: undefined,
      lastModeId: 'decks',
    })
    expect(r.mode.id).toBe('decks')
    expect(r.reason).toBe('last-mode')
  })

  it('not from daily, unknown last mode id → falls back to essential words', () => {
    const r = resolveRecommendedMode({
      fromDaily: false,
      arc: undefined,
      lastModeId: 'nonsense',
    })
    expect(r.mode.id).toBe('core-1000')
    expect(r.reason).toBe('fallback')
  })

  it('nothing known → fallback to essential words', () => {
    const r = resolveRecommendedMode({
      fromDaily: false,
      arc: undefined,
      lastModeId: null,
    })
    expect(r.mode.id).toBe('core-1000')
    expect(r.reason).toBe('fallback')
  })

  it('every mode has a unique id and a route', () => {
    const ids = PRACTICE_MODES.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const m of PRACTICE_MODES) expect(m.href.startsWith('/')).toBe(true)
  })
})
