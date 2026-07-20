import { JournalWorkspace } from '@/components/journal/JournalWorkspace'
import PageHeader from '@/components/layout/PageHeader'
import PageLayout from '@/components/layout/PageLayout'
import { journalPromptForDate } from '@/lib/journal/prompts'
import { getTodayLocalDateKey } from '@/lib/date/local-date'
import { getSupabaseServerUserId } from '@/lib/supabase/session'
import { getUserInterests } from '@/lib/users/server-queries'
import { redirect } from 'next/navigation'

export default async function JournalPage() {
  const userId = await getSupabaseServerUserId()
  if (!userId) redirect('/login')

  const entryDate = getTodayLocalDateKey()
  const interests = await getUserInterests(userId)
  const prompt = journalPromptForDate(entryDate, interests)
  const now = new Date().toISOString()

  return (
    <PageLayout className="mx-auto max-w-3xl">
      <PageHeader
        kicker="PRÁCTICA"
        title="Journal"
        subtitle="Escribe en inglés y recibe una corrección útil cuando estés listo."
      />
      <JournalWorkspace
        entry={{
          id: crypto.randomUUID(),
          userId,
          entryDate,
          prompt,
          content: '',
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        }}
      />
    </PageLayout>
  )
}
