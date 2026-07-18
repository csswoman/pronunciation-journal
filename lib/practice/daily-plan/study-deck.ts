import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'
import { studyLessonPath } from '@/lib/courses/curriculumIndex'
import { deriveLevelView, lessonProgressKey } from '@/lib/courses/progress'
import type { CefrLevelId, CoursePathLesson, CoursePathLevel } from '@/lib/courses/types'
import type { DailyStep } from '@/lib/practice/types'

type StudyDeckTarget = { level: CoursePathLevel; lesson: CoursePathLesson }

const CORE_LEVELS = COURSE_PATH_CURRICULUM.levels

function levelsFrom(activeLevel: CefrLevelId): CoursePathLevel[] {
  const index = CORE_LEVELS.findIndex((level) => level.id === activeLevel)
  return index < 0 ? CORE_LEVELS : [...CORE_LEVELS.slice(index), ...CORE_LEVELS.slice(0, index)]
}

/**
 * Finds the next essential lesson from the learner's active CEFR level, then
 * advances through later levels. If the core path is complete, surface an
 * unseen optional lesson rather than leaving the daily theory slot empty.
 */
export function selectStudyDeckTarget(
  completedIds: Set<string>,
  activeLevel: CefrLevelId = 'a1',
): StudyDeckTarget | null {
  const orderedLevels = levelsFrom(activeLevel)

  for (const level of orderedLevels) {
    const current = deriveLevelView(level, completedIds)
      .units.flatMap((unit) => unit.lessons)
      .find((lesson) => lesson.state === 'current')
    if (current) return { level, lesson: current }
  }

  for (const level of orderedLevels) {
    const optional = level.units
      .filter((unit) => unit.isOptionalSection)
      .flatMap((unit) => unit.lessons)
      .find((lesson) => !completedIds.has(lessonProgressKey(level.id, lesson.id)))
    if (optional) return { level, lesson: optional }
  }

  return null
}

export function buildStudyDeckStep(
  completedIds: Set<string>,
  activeLevel: CefrLevelId = 'a1',
): DailyStep | null {
  const target = selectStudyDeckTarget(completedIds, activeLevel)
  if (!target) return null

  return {
    kind: 'study_deck',
    id: `study_deck:${target.level.id}:${target.lesson.id}`,
    title: 'Estudia teoría',
    subtitle: target.lesson.title,
    icon: 'GraduationCap',
    exercises: [],
    estMinutes: 5,
    href: studyLessonPath(target.level.id, target.lesson.number),
  }
}
