import { describe, it, expect } from 'vitest'
import { buildMiniLessonStep, theoryTopicForMiniLessonStepId } from '../mini-lesson-step'

describe('buildMiniLessonStep', () => {
  it('proposes the mini-lesson equivalent to the day weak topic deck', () => {
    const step = buildMiniLessonStep('grammar:articles', new Set())
    expect(step).not.toBeNull()
    expect(step?.id).toBe('mini_lesson:articles-a-an-the')
    expect(step?.href).toBe('/mini-lessons/articles-a-an-the')
    expect(step?.kind).toBe('concept')
  })

  it('returns null when there is no weak topic', () => {
    expect(buildMiniLessonStep(undefined, new Set())).toBeNull()
  })

  it('returns null when the weak topic has no authored deck equivalence', () => {
    expect(buildMiniLessonStep('not-a-real-topic', new Set())).toBeNull()
  })

  it('returns null once the mini-lesson is already completed', () => {
    const step = buildMiniLessonStep('grammar:articles', new Set(['mini-lessons:articles-a-an-the']))
    expect(step).toBeNull()
  })
})

describe('theoryTopicForMiniLessonStepId', () => {
  it('resolves the shared theory topic for a mini_lesson step id', () => {
    expect(theoryTopicForMiniLessonStepId('mini_lesson:articles-a-an-the')).toBe('theory:a1 articulos basicos')
  })

  it('returns null for a non mini_lesson id', () => {
    expect(theoryTopicForMiniLessonStepId('study_deck:a1:1')).toBeNull()
  })
})
