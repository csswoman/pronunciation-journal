import { describe, it, expect } from 'vitest'
import { miniLessonLevel } from '../lessons'

describe('miniLessonLevel', () => {
  it('derives the CEFR level from the equivalent deck prefix', () => {
    expect(miniLessonLevel('articles-a-an-the')).toBe('a1')
    expect(miniLessonLevel('second-conditional')).toBe('b1')
    expect(miniLessonLevel('third-conditional')).toBe('b2')
    expect(miniLessonLevel('academic-writing-cohesion')).toBe('c1')
  })

  it('returns null for connected-speech decks (no CEFR prefix)', () => {
    expect(miniLessonLevel('basic-listening-reductions')).toBeNull()
  })

  it('returns null when there is no authored deck equivalence', () => {
    expect(miniLessonLevel('not-a-real-slug')).toBeNull()
  })
})
