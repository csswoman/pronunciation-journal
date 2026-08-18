import { describe, it, expect } from 'vitest'
import { resolveRecommendedMode, PRACTICE_MODES } from '../practice-modes'

describe('resolveRecommendedMode', () => {
  it('prioritizes due review over every other recommendation', () => {
    const r = resolveRecommendedMode({
      fromDaily: true,
      arc: { soundIpa: 'æ', topicLabel: null, sessionWords: [] },
      lastModeId: 'decks',
      dueCount: 3,
    })

    expect(r.mode.id).toBe('review')
    expect(r.reason).toBe('due-review')
    expect(r.headline).toContain('3 palabras pendientes')
  })

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
    expect(r.mode.id).toBe('essential-words')
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
    expect(r.mode.id).toBe('essential-words')
    expect(r.reason).toBe('fallback')
  })

  it('nothing known → fallback to essential words', () => {
    const r = resolveRecommendedMode({
      fromDaily: false,
      arc: undefined,
      lastModeId: null,
    })
    expect(r.mode.id).toBe('essential-words')
    expect(r.reason).toBe('fallback')
    expect(r.headline).toBe('Empieza por lo esencial')
    expect(r.subtext).toContain('2500')
  })

  it('describes essential words as more than 2500 high-frequency items', () => {
    const mode = PRACTICE_MODES.find((m) => m.id === 'essential-words')
    expect(mode?.description).toContain('2500')
  })

  it('every mode has a unique id and a route', () => {
    const ids = PRACTICE_MODES.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const m of PRACTICE_MODES) expect(m.href.startsWith('/')).toBe(true)
  })

  it('includes Reader exactly once with its canonical route and icon', () => {
    const readerModes = PRACTICE_MODES.filter((mode) => mode.id === 'reader')
    expect(readerModes).toEqual([
      {
        id: 'reader',
        label: 'Lectura',
        description: 'Practica tus palabras recientes en contexto',
        href: '/practice/reader',
        icon: 'BookOpen',
      },
    ])
  })
})
