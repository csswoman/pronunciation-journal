import { describe, expect, it } from 'vitest'
import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'
import { lessonProgressKey } from '@/lib/courses/progress'
import { buildStudyDeckStep, selectStudyDeckTarget } from '../study-deck'

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
})
