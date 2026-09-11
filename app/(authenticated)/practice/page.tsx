import PracticeHubClient from '@/components/practice/hub/PracticeHubClient'
import { getSupabaseServerUser } from '@/lib/supabase/session'
import { getPracticeHubData, emptyPracticeHubData } from '@/lib/practice/hub-data'

interface PageProps {
  searchParams: Promise<{ from?: string }>
}

export default async function PracticePage({ searchParams }: PageProps) {
  const { from } = await searchParams
  const user = await getSupabaseServerUser()
  const hubData = user ? await getPracticeHubData(user.id) : emptyPracticeHubData()

  return <PracticeHubClient fromDaily={from === 'daily'} serverData={hubData} />
}
