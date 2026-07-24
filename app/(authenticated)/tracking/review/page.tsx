import TrackingReviewClient from '@/components/tracking/TrackingReviewClient'

export default async function TrackingReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>
}) {
  const { session } = await searchParams
  return <TrackingReviewClient sessionId={session ?? null} />
}
