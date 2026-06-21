import { redirect } from 'next/navigation'

/** Legacy phoneme-only review → unified review hub. */
export default function LegacyReviewRedirect() {
  redirect('/practice/review')
}
