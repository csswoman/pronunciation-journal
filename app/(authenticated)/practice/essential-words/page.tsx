import PageLayout from '@/components/layout/PageLayout'
import { EssentialWordsSession } from '@/components/practice/essential-words/EssentialWordsSession'
import { getSupabaseServerUserId } from '@/lib/supabase/session'
import { getDailyStreak } from '@/lib/daily/streak'

export const metadata = { title: 'Palabras esenciales' }

export default async function EssentialWordsPage() {
  const userId = await getSupabaseServerUserId()
  const streak = userId
    ? await getDailyStreak(userId).then((r) => r.currentStreak).catch(() => 0)
    : 0

  return (
    <PageLayout archetype="session">
      <EssentialWordsSession initialStreak={streak} />
    </PageLayout>
  )
}
