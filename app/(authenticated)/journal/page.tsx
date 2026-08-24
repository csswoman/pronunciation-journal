import { JournalNotebookClient } from '@/components/journal/JournalNotebookClient'
import { getTodayLocalDateKey } from '@/lib/date/local-date'
import { getSupabaseServerUserId } from '@/lib/supabase/session'
import { redirect } from 'next/navigation'

export default async function JournalHomePage() {
  const userId = await getSupabaseServerUserId()
  // Guest bootstrap may still be establishing the session; avoid a hard login wall.
  if (!userId) redirect('/login?intent=explore')

  const todayDate = getTodayLocalDateKey()

  return <JournalNotebookClient userId={userId} todayDate={todayDate} />
}
