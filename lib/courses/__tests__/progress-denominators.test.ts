import { describe, expect, it } from 'vitest'
import { COURSE_PATH_CURRICULUM } from '../curriculum'
import { deriveLevelView, getCoreLessons, lessonProgressKey } from '../progress'

describe('required course progress', () => {
  const level = COURSE_PATH_CURRICULUM.levels[0]
  it('does not let optional lessons complete the required curriculum', () => {
    const completed = new Set(level.units.flatMap((unit) => unit.lessons)
      .filter((lesson) => lesson.isOptional)
      .map((lesson) => lessonProgressKey(level.id, lesson.id)))
    const view = deriveLevelView(level, completed)
    expect(view.completedCoreLessons).toBe(0)
    expect(view.progressPercent).toBe(0)
    expect(view.totalCoreLessons).toBe(getCoreLessons(level).length)
  })
  it('reports no required percentage for an optional-only route', () => {
    const optional = { ...level, units: level.units.map((unit) => ({ ...unit, isOptionalSection: true })) }
    expect(deriveLevelView(optional, new Set()).progressPercent).toBeNull()
  })
})
