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

  try {
    const user = await getSupabaseServerUser()
    if (user) {
      // El corte semanal ya incluye la racha: una sola pasada en vez de dos.
      weeklyProgress = await getWeeklyProgressData(user.id)
      streak = weeklyProgress.streak.currentStreak
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
    />
  )
}
