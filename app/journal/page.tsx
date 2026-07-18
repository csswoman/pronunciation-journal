import { JournalWorkspace } from '@/components/journal/JournalWorkspace'
import { journalPromptForDate } from '@/lib/journal/prompts'
import { getTodayLocalDateKey } from '@/lib/date/local-date'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getUserInterests } from '@/lib/users/server-queries'
import { redirect } from 'next/navigation'

export default async function JournalPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const entryDate = getTodayLocalDateKey()
  const interests = await getUserInterests(user.id)
  const prompt = journalPromptForDate(entryDate, interests)
  const now = new Date().toISOString()

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <JournalWorkspace
        entry={{
          id: crypto.randomUUID(),
          userId: user.id,
          entryDate,
          prompt,
          content: '',
          status: 'draft',
          createdAt: now,
          updatedAt: now,
        }}
      />
    </main>
  )
}
