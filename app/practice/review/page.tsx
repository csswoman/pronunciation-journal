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
    <PageLayout cardWrapper={false}>
      <div className="w-full px-6 pb-18">
        <header className="flex flex-col gap-2 pt-2 pb-8">
          <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            Repaso espaciado
          </span>
          <h1 className="font-display text-h2 font-normal leading-tight tracking-[-0.02em] text-fg">
            Review Hub
          </h1>
          <p className="max-w-xl text-body-sm text-fg-muted">
            Frases falladas, palabras débiles, SRS de vocabulario y sonidos due — en un solo lugar.
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
