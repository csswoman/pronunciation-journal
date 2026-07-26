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
})
