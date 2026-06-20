export const dynamic = 'force-dynamic'

import DailyChecklist, { type ConceptLesson } from '@/components/daily/DailyChecklist'
import { getTodaysMiniLesson } from '@/lib/content/lessons'
import { getDailyStreak } from '@/lib/daily/streak'
import { createSupabaseServerClient } from '@/lib/supabase/server'

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
      conceptLesson = { slug: lesson.slug, title: lesson.title, subtitle: lesson.subtitle }
    }
  } catch {
    conceptLesson = null
  }

  let streak: number | null = null
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const result = await getDailyStreak(user.id)
      streak = result.currentStreak
    }
  } catch {
    streak = null
  }

  return <DailyChecklist conceptLesson={conceptLesson} initialStepId={step} streak={streak} />
}
