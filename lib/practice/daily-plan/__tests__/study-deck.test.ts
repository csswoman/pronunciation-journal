import { describe, expect, it } from 'vitest'
import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'
import { lessonProgressKey } from '@/lib/courses/progress'
import { buildStudyDeckStep, selectStudyDeckTarget } from '../study-deck'
import type { ConceptSignal } from '@/lib/courses/concept-profile'

function signal(
  lessonSlug: string,
  level: ConceptSignal['level'],
  status: ConceptSignal['status'],
): ConceptSignal {
  return {
    lessonSlug,
    level,
    title: lessonSlug,
    selfRating: status === 'learn' ? 'unknown' : 'familiar',
    status,
    correct: 0,
    total: 1,
    assessedAt: '2026-07-18T12:00:00.000Z',
  }
}

describe('study-deck daily step', () => {
  it('selects the first pending essential lesson in the active level', () => {
    const a1 = COURSE_PATH_CURRICULUM.levels[0]
    const first = a1.units[0].lessons[0]
    const target = selectStudyDeckTarget(new Set(), 'a1')

    expect(target).toMatchObject({ level: { id: 'a1' }, lesson: { id: first.id } })
  })

  it('advances to the next level when the active level core is complete', () => {
    const a1 = COURSE_PATH_CURRICULUM.levels[0]
    const completed = new Set(
      a1.units
        .filter((unit) => !unit.isOptionalSection)
        .flatMap((unit) => unit.lessons)
        .map((lesson) => lessonProgressKey('a1', lesson.id)),
    )

    const target = selectStudyDeckTarget(completed, 'a1')
    expect(target?.level.id).toBe('a2')
    expect(target?.lesson.number).toBe(1)
  })

  it('builds a link to the complete route viewer without exercises', () => {
    const step = buildStudyDeckStep(new Set(), 'a1')

    expect(step).toMatchObject({
      kind: 'study_deck',
      exercises: [],
      href: '/courses/study/1?level=a1',
    })
  })

  it('prioritizes review before learn across the active and later levels', () => {
    const a1Lesson = COURSE_PATH_CURRICULUM.levels[0].units[0].lessons[2]
    const b1Lesson = COURSE_PATH_CURRICULUM.levels[2].units[0].lessons[1]

    const target = selectStudyDeckTarget(new Set(), 'a1', [
      signal(a1Lesson.slug!, 'a1', 'learn'),
      signal(b1Lesson.slug!, 'b1', 'review'),
    ])

    expect(target).toMatchObject({ level: { id: 'b1' }, lesson: { slug: b1Lesson.slug } })
  })

  it('skips mastered concepts in fallback without changing completion state', () => {
    const a1 = COURSE_PATH_CURRICULUM.levels[0]
    const [first, second] = a1.units[0].lessons
    const completed = new Set<string>()

    const target = selectStudyDeckTarget(completed, 'a1', [
      signal(first.slug!, 'a1', 'mastered'),
    ])

    expect(target?.lesson.id).toBe(second.id)
    expect(completed.size).toBe(0)
  })

  it('does not recommend a signaled lesson that is already completed', () => {
    const a1 = COURSE_PATH_CURRICULUM.levels[0]
    const [first, second] = a1.units[0].lessons
    const completed = new Set([lessonProgressKey('a1', first.id)])

    const target = selectStudyDeckTarget(completed, 'a1', [
      signal(first.slug!, 'a1', 'review'),
      signal(second.slug!, 'a1', 'learn'),
    ])

    expect(target?.lesson.id).toBe(second.id)
  })

  it('keeps the legacy sequential fallback when concept signals are absent', () => {
    const expected = selectStudyDeckTarget(new Set(), 'a2')
    const target = selectStudyDeckTarget(new Set(), 'a2', [])

    expect(target).toEqual(expected)
  })
})
