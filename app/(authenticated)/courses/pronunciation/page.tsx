import PageLayout from '@/components/layout/PageLayout'
import { PronunciationPathPage } from '@/components/courses/pronunciation-path/PronunciationPathPage'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { getSupabaseServerUser } from '@/lib/supabase/session'

export default async function PronunciationLearningRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; stage?: string }>
}) {
  const params = await searchParams
  const user = isSupabaseConfigured() ? await getSupabaseServerUser() : null

  return (
    <PageLayout archetype="catalog">
      <PronunciationPathPage
        userId={user?.id}
        initialTargetId={params.target}
        initialStage={params.stage}
      />
    </PageLayout>
  )
}
