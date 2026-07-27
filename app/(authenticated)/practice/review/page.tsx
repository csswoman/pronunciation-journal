import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import { GuestBanner } from '@/components/layout/stats/GuestBanner'
import { ReviewHubClient } from '@/components/practice/review/ReviewHubClient'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getReviewHubSummary } from '@/lib/review/server-queries'

export const metadata = { title: 'Review Hub' }

export default async function PracticeReviewPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const summary = user ? await getReviewHubSummary(user.id) : null

  return (
    <PageLayout archetype="dashboard">
      <PageHeader
        kicker="Seguimiento"
        title="Review"
        subtitle="Oraciones fallidas, palabras débiles, SRS de vocabulario y sonidos pendientes — en un solo lugar."
      />

      {!user || !summary ? (
        <GuestBanner />
      ) : (
        <ReviewHubClient summary={summary} />
      )}
    </PageLayout>
  )
}
