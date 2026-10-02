import { describe, expect, it } from 'vitest'
import { focusContentHref, focusContentId, focusContentSlug } from '../content-url'

describe('focus content URL', () => {
  it('acorta UUID sin perder identidad', () => {
    const id = '123e4567-e89b-42d3-a456-426614174000'
    expect(focusContentSlug(id)).toHaveLength(22)
    expect(focusContentId(focusContentSlug(id))).toBe(id)
  })

  it('permite enlaces anteriores con UUID completo', () => {
    const id = '123e4567-e89b-42d3-a456-426614174000'
    expect(focusContentId(id)).toBe(id)
  })

  it('usa una ruta canónica para identificadores nuevos y heredados', () => {
    const id = '123e4567-e89b-42d3-a456-426614174000'
    expect(focusContentHref(id)).toBe(`/focus/c/${focusContentSlug(id)}`)
    expect(focusContentHref('local-content-1')).toBe('/focus/c/local-content-1')
  })
})
