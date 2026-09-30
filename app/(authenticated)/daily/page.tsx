export const dynamic = 'force-dynamic'

// Planned structure:
// <DailyPage>
//   <DailyChecklist /> (loads todays lesson, streak, weekly progress, step query param)
// </DailyPage>

import DailyChecklist, { type ConceptLesson } from '@/components/daily/DailyChecklist'
import { getTodaysMiniLesson } from '@/lib/content/lessons'
import { getDailyStreak } from '@/lib/daily/streak'
import { getWeeklyProgressData, type WeeklyProgressData } from '@/lib/progress/weekly-queries'
import { getSupabaseServerUser } from '@/lib/supabase/session'
import { getUserProfileLevel, getWeakestPhonemeForHome } from '@/lib/home/queries'
import { getHomePlacementState, type HomePlacementState } from '@/lib/home/placement-state'
import { getHomePronunciationDiagnosticState, type HomePronunciationDiagnosticState } from '@/lib/home/pronunciation-diagnostic-state'
import { getCheckpointReadiness } from '@/lib/home/checkpoint-readiness-query'
import type { CheckpointReadiness } from '@/lib/home/checkpoint-readiness'
import type { WeakestPhonemeHome } from '@/lib/home/constants'
import type { CefrLevelId } from '@/lib/courses/types'

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  const { step } = await searchParams

  let conceptLesson: ConceptLesson | null = null

  try {
    const lesson = await getTodaysMiniLesson()
    if (lesson) {
      conceptLesson = {
        slug: lesson.slug,
        title: lesson.title,
        subtitle: lesson.subtitle,
        body: lesson.body,
      }
    }
  } catch {
    conceptLesson = null
  }

  let streak: number | null = null
  let weeklyProgress: WeeklyProgressData | null = null
  let checkpointReadiness: CheckpointReadiness | null = null
  let weakestPhoneme: WeakestPhonemeHome | null = null
  let placementState: HomePlacementState = { hasPlacement: true, hasMeaningfulProgress: true }
  let pronunciationDiagnosticState: HomePronunciationDiagnosticState = { hasPronunciationDiagnostic: true }

  try {
    const user = await getSupabaseServerUser()
    if (user) {
      // El corte semanal ya incluye la racha: una sola pasada en vez de dos.
      weeklyProgress = await getWeeklyProgressData(user.id)
      streak = weeklyProgress.streak.currentStreak

      try {
        const [profileLevel, pState, pDiagState, weakSound] = await Promise.all([
          getUserProfileLevel(user.id),
          getHomePlacementState(user.id),
          getHomePronunciationDiagnosticState(user.id),
          getWeakestPhonemeForHome(user.id),
        ])
        placementState = pState
        pronunciationDiagnosticState = pDiagState
        weakestPhoneme = weakSound
        const resolvedLevelId = profileLevel ? (profileLevel.toLowerCase() as CefrLevelId) : null
        if (placementState.hasPlacement && resolvedLevelId) {
          checkpointReadiness = await getCheckpointReadiness(user.id, resolvedLevelId)
        }
      } catch {
        checkpointReadiness = null
      }
    }
  } catch {
    weeklyProgress = null
    // Sin el corte semanal, la racha sigue mereciendo su propio intento.
    try {
      const user = await getSupabaseServerUser()
      if (user) {
        const result = await getDailyStreak(user.id)
        streak = result.currentStreak
      }
    } catch {
      streak = null
    }
  }

  return (
    <DailyChecklist
      conceptLesson={conceptLesson}
      initialStepId={step}
      streak={streak}
      weeklyProgress={weeklyProgress}
      checkpointReadiness={checkpointReadiness}
      weakestPhoneme={weakestPhoneme}
      placementState={placementState}
      pronunciationDiagnosticState={pronunciationDiagnosticState}
    />
  )
}
