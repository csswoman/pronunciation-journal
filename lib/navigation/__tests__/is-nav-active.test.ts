import { describe, expect, it } from 'vitest'
import { isNavActive } from '../is-nav-active'

describe('isNavActive', () => {
  it('matches home only on exact path', () => {
    expect(isNavActive('/', '/')).toBe(true)
    expect(isNavActive('/courses', '/')).toBe(false)
  })

  it('keeps Ruta inactive on the pronunciation path', () => {
    expect(isNavActive('/courses', '/courses')).toBe(true)
    expect(isNavActive('/courses/study/3', '/courses')).toBe(true)
    expect(isNavActive('/courses/pronunciation', '/courses')).toBe(false)
  })

  it('activates Pronunciación on its own subtree', () => {
    expect(isNavActive('/courses/pronunciation', '/courses/pronunciation')).toBe(true)
    expect(isNavActive('/courses/pronunciation', '/courses')).toBe(false)
    expect(isNavActive('/courses', '/courses/pronunciation')).toBe(false)
  })

  it('activates Práctica on /practice and its general subpaths, but not pronunciation subpaths', () => {
    expect(isNavActive('/practice', '/practice')).toBe(true)
    expect(isNavActive('/practice/decks', '/practice')).toBe(true)
    expect(isNavActive('/practice/review', '/practice')).toBe(true)
    expect(isNavActive('/practice/sounds', '/practice')).toBe(false)
    expect(isNavActive('/practice/intonation', '/practice')).toBe(false)
    expect(isNavActive('/practice/connected-speech', '/practice')).toBe(false)
  })

  it('matches pronunciation subpaths and query tabs', () => {
    expect(isNavActive('/practice/sounds', '/practice/sounds')).toBe(true)
    expect(isNavActive('/practice/sounds?tab=minimal-pairs', '/practice/sounds?tab=minimal-pairs')).toBe(true)
    expect(isNavActive('/practice/sounds?tab=path', '/practice/sounds?tab=minimal-pairs')).toBe(false)
    expect(isNavActive('/practice/intonation', '/practice/intonation')).toBe(true)
    expect(isNavActive('/practice/connected-speech', '/practice/connected-speech')).toBe(true)
  })

  it('activates Diccionario only on /words, not /tracking', () => {
    expect(isNavActive('/words', '/words')).toBe(true)
    expect(isNavActive('/words?mode=saved', '/words')).toBe(true)
    expect(isNavActive('/tracking', '/words')).toBe(false)
  })

  it('activates Guardadas on /tracking and /tracking/review', () => {
    expect(isNavActive('/tracking', '/tracking')).toBe(true)
    expect(isNavActive('/tracking/review', '/tracking')).toBe(true)
    expect(isNavActive('/progress', '/tracking')).toBe(false)
  })
})

