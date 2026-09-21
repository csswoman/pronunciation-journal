import { describe, expect, it } from 'vitest'
import { focusContentId, focusContentSlug } from '../content-url'

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
})
