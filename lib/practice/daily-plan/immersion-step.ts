import { fetchImmersionLessonForDay } from '@/lib/immersion/queries'
import type { ImmersionLevel } from '@/lib/immersion/types'
import type { CefrLevelId } from '@/lib/courses/types'
import type { DailyStep } from '@/lib/practice/types'

/**
 * Cada 4 días, para no competir por el slot de teoría (study_deck, cada 2
 * días) ni saturar la diaria con un video largo todos los días.
 */
export const IMMERSION_CADENCE_DAYS = 4

export function shouldOfferImmersionLesson(day: number): boolean {
  return day % IMMERSION_CADENCE_DAYS === 0
}

/**
 * engVid solo publica tres niveles (ver lib/immersion/types.ts). El curso
 * interno tiene seis; a1/a2 caen en la lección A2, b1/b2 en B1, c1/c2 en C1.
 */
export function cefrToImmersionLevel(level: CefrLevelId): ImmersionLevel {
  if (level === 'a1' || level === 'a2') return 'A2'
  if (level === 'b1' || level === 'b2') return 'B1'
  return 'C1'
}

export async function buildImmersionLessonStep(
  activeLevel: CefrLevelId | undefined,
  watchedLessonIds: Set<string>,
  day: number,
): Promise<DailyStep | null> {
  if (!shouldOfferImmersionLesson(day)) return null

  const level = cefrToImmersionLevel(activeLevel ?? 'a1')
  const lesson = await fetchImmersionLessonForDay(level, watchedLessonIds).catch(() => null)
  if (!lesson) return null

  return {
    kind: 'immersion_lesson',
    id: `immersion_lesson:${lesson.id}`,
    title: `Inmersión: ${lesson.title}`,
    subtitle: `${lesson.teacher} · ${lesson.durationMinutes} min · ${lesson.level}`,
    icon: 'Clapperboard',
    exercises: [],
    estMinutes: lesson.durationMinutes,
    href: `/practice/immersion/${lesson.slug}`,
  }
}
