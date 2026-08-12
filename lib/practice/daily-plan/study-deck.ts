import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'
import { studyLessonPath } from '@/lib/courses/curriculumIndex'
import { deriveLevelView, lessonProgressKey } from '@/lib/courses/progress'
import type { CefrLevelId, CoursePathLesson, CoursePathLevel } from '@/lib/courses/types'
import type { ConceptSignal, ConceptStatus } from '@/lib/courses/concept-profile'
import type { DailyStep } from '@/lib/practice/types'

type StudyDeckTarget = { level: CoursePathLevel; lesson: CoursePathLesson }

const CORE_LEVELS = COURSE_PATH_CURRICULUM.levels

function levelsFrom(activeLevel: CefrLevelId): CoursePathLevel[] {
  const index = CORE_LEVELS.findIndex((level) => level.id === activeLevel)
  return index < 0 ? CORE_LEVELS : [...CORE_LEVELS.slice(index), ...CORE_LEVELS.slice(0, index)]
}

function signaledTarget(
  activeLevel: CefrLevelId,
  completedIds: Set<string>,
  concepts: readonly ConceptSignal[],
): StudyDeckTarget | null {
  const activeIndex = CORE_LEVELS.findIndex((level) => level.id === activeLevel)
  const eligibleLevels = activeIndex < 0 ? CORE_LEVELS : CORE_LEVELS.slice(activeIndex)
  const signalBySlug = new Map(concepts.map((signal) => [signal.lessonSlug, signal]))

  for (const status of ['review', 'learn'] satisfies ConceptStatus[]) {
    for (const level of eligibleLevels) {
      const lesson = level.units
        .flatMap((unit) => unit.lessons)
        .find((candidate) => {
          const signal = signalBySlug.get(candidate.slug ?? '')
          if (!signal || signal.status !== status) return false
          if (status === 'review' && signal.verificationDueAt) {
            if (Date.parse(signal.verificationDueAt) > Date.now()) return false
          }
          return !completedIds.has(lessonProgressKey(level.id, candidate.id))
        })
      if (lesson) return { level, lesson }
    }
  }

  return null
}

/**
 * Finds the next essential lesson from the learner's active CEFR level, then
 * advances through later levels. If the core path is complete, surface an
 * unseen optional lesson rather than leaving the daily theory slot empty.
 */
export function selectStudyDeckTarget(
  completedIds: Set<string>,
  activeLevel: CefrLevelId = 'a1',
  concepts?: readonly ConceptSignal[],
): StudyDeckTarget | null {
  if (concepts?.length) {
    const priority = signaledTarget(activeLevel, completedIds, concepts)
    if (priority) return priority

    // Mastery from the diagnostic skips a lesson for plan selection only. It
    // does not write course completion or alter the learner's route progress.
    completedIds = new Set(completedIds)
    for (const level of CORE_LEVELS) {
      for (const lesson of level.units.flatMap((unit) => unit.lessons)) {
        if (concepts.some((signal) => signal.lessonSlug === lesson.slug && signal.status === 'mastered')) {
          completedIds.add(lessonProgressKey(level.id, lesson.id))
        }
      }
    }
  }

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
  concepts?: readonly ConceptSignal[],
): DailyStep | null {
  const target = selectStudyDeckTarget(completedIds, activeLevel, concepts)
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
