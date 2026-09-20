import type { ReviewQueueCounts } from './types'

export interface AggregatedReviewSummary {
  hasPendingReview: boolean
  totalDue: number
  queueCounts: ReviewQueueCounts
  primaryQueue: 'words' | 'essential_words' | 'chunks' | 'topics' | 'sounds' | 'sentences' | 'lessons' | null
  headline: string
  subtext: string
}
