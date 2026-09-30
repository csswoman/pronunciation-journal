import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'
import type { AssessmentConcept } from '@/lib/courses/concept-profile'
import type { CefrLevelId } from '@/lib/courses/types'

export type TopicItem = {
  lessonSlug: string
  level: CefrLevelId
  title: string
  group: string
  keywords?: string
}

export const GROUP_LABEL_OVERRIDES: Record<string, string> = {
  'Cómo empezar': 'PARA EMPEZAR',
  'Gramática base': 'GRAMÁTICA BÁSICA',
}

export const ALL_LEVELS: { id: CefrLevelId; label: string }[] = [
  { id: 'a1', label: 'A1' },
  { id: 'a2', label: 'A2' },
  { id: 'b1', label: 'B1' },
  { id: 'b2', label: 'B2' },
  { id: 'c1', label: 'C1' },
  { id: 'c2', label: 'C2' },
]

export function collectLevelTopics(level: CefrLevelId): TopicItem[] {
  const track = COURSE_PATH_CURRICULUM.levels.find((item) => item.id === level)
  if (!track) return []

  const topics: TopicItem[] = []
  for (const unit of track.units) {
    for (const lesson of unit.lessons) {
      if (!lesson.slug) continue
      topics.push({
        lessonSlug: lesson.slug,
        level,
        title: lesson.title,
        group: lesson.group || unit.label || 'General',
        keywords: lesson.keywords ? lesson.keywords.replace(/\s*·\s*/g, ', ') : undefined,
      })
    }
  }
  return topics
}

export function findConceptBySlug(slug: string): AssessmentConcept | null {
  for (const track of COURSE_PATH_CURRICULUM.levels) {
    for (const unit of track.units) {
      for (const lesson of unit.lessons) {
        if (lesson.slug === slug) {
          return {
            lessonSlug: slug,
            level: track.id as CefrLevelId,
            title: lesson.title,
          }
        }
      }
    }
  }
  return null
}
