import PageLayout from '@/components/layout/PageLayout'
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
    <PageLayout cardWrapper={false} className="pb-18">
      <div className="w-full">
        <header className="flex flex-col gap-2 pt-2 pb-8">
          <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            Spaced repetition
          </span>
          <h1 className="font-display text-h2 font-normal leading-tight tracking-[-0.02em] text-fg">
            Review Hub
          </h1>
          <p className="max-w-xl text-body-sm text-fg-muted">
            Failed sentences, weak words, vocabulary SRS, and sounds due — all in one place.
          </p>
        </header>

        {!user || !summary ? (
          <GuestBanner />
        ) : (
          <ReviewHubClient summary={summary} />
        )}
      </div>
    </PageLayout>
  )
}
