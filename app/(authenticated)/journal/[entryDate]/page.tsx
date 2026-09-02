import { notFound } from 'next/navigation'
import PageLayout from '@/components/layout/PageLayout'
import { JournalHistoryEntryClient } from '@/components/journal/JournalHistoryEntryClient'
import { toLocalDateKey } from '@/lib/date/local-date'
import { getSupabaseServerUserId } from '@/lib/supabase/session'

export default async function JournalHistoryPage({
  params,
}: {
  params: Promise<{ entryDate: string }>
}) {
  const { entryDate } = await params
  const parsedDate = new Date(`${entryDate}T12:00:00`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(entryDate) ||
    Number.isNaN(parsedDate.getTime()) ||
    toLocalDateKey(parsedDate) !== entryDate
  ) notFound()

  const userId = await getSupabaseServerUserId()
  if (!userId) notFound()

  return (
    <PageLayout archetype="catalog">
      <JournalHistoryEntryClient userId={userId} entryDate={entryDate} />
    </PageLayout>
  )
}
