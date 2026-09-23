import { describe, it, expect } from 'vitest'
import { groupMiniLessonsByLearnerLevel, miniLessonCefrLevel } from '../mini-lesson-order'
import type { MiniLesson } from '../schemas'

function makeLesson(id: number, slug: string): MiniLesson {
  return {
    id,
    slug,
    level: 'basic',
    category: 'grammar',
    duration: 3,
    title: slug,
    subtitle: slug,
    body: slug,
    examples: [],
  } as unknown as MiniLesson
}

describe('miniLessonCefrLevel', () => {
  it('mirrors the deck-equivalence-derived CEFR level', () => {
    expect(miniLessonCefrLevel('articles-a-an-the')).toBe('a1')
    expect(miniLessonCefrLevel('basic-listening-reductions')).toBeNull()
  })
})

describe('groupMiniLessonsByLearnerLevel', () => {
  const a1 = makeLesson(1, 'articles-a-an-the') // a1
  const a2 = makeLesson(2, 'some-any') // a2
  const b1 = makeLesson(3, 'second-conditional') // b1
  const c1 = makeLesson(4, 'academic-writing-cohesion') // c1
  const general = makeLesson(5, 'basic-listening-reductions') // no CEFR
  const lessons = [a1, a2, b1, c1, general]

  it('puts learner level ±1 in forYourLevel without hiding anything', () => {
    const { forYourLevel, byLevel, general: gen } = groupMiniLessonsByLearnerLevel(lessons, 'a1')
    expect(forYourLevel.map((l) => l.slug)).toEqual(['articles-a-an-the', 'some-any'])
    const totalGrouped = byLevel.reduce((n, g) => n + g.lessons.length, 0) + gen.length
    expect(totalGrouped).toBe(lessons.length)
  })

  it('keeps lessons without CEFR equivalence in general, never in forYourLevel', () => {
    const { forYourLevel, general: gen } = groupMiniLessonsByLearnerLevel(lessons, 'b1')
    expect(forYourLevel.some((l) => l.slug === 'basic-listening-reductions')).toBe(false)
    expect(gen.map((l) => l.slug)).toEqual(['basic-listening-reductions'])
  })

  it('falls back to plain level grouping with no learner level (guest)', () => {
    const { forYourLevel } = groupMiniLessonsByLearnerLevel(lessons, null)
    expect(forYourLevel).toEqual([])
  })
})
