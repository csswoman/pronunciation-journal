import type { SoundDueHome } from '@/lib/home/constants'
import type { WordBankEntry } from '@/lib/word-bank/types'

export interface FailedSentenceItem {
  contentId: string
  wordBankId: string | null
  slug: string
  /** Sentence, phrase, or deck title shown to the user. */
  label: string
  /** Human-readable exercise type (e.g. "Dictado"). */
  typeLabel: string
  /** True when this failure can be turned into a review step today. */
  drillable: boolean
  /** Resolved sentence text when available (for dictation / reorder). */
  phrase: string | null
  failedAt: string
}

export interface TopicSrsRow {
  id: string
  topic: string
  interval_days: number
  next_review_at: string | null
  srs_status: 'new' | 'learning' | 'review' | 'mastered'
  ease_factor: number
  last_reviewed_at: string | null
}

export interface LessonReviewItem {
  id: string
  title: string
  type: 'immersion' | 'course'
  typeLabel: string
  url: string
  lastStudiedAt: string
  dueAt: string
  daysSinceStudy: number
  summary?: string
}

export interface EssentialWordReviewItem {
  id: string
  wordId: string
  word: string
  skill: 'meaning' | 'listening' | 'production' | 'usage'
  dueAt: string
}

export interface ReviewQueueCounts {
  failedSentences: number
  weakWords: number
  dueWords: number
  soundsDue: number
  dueTopics: number
  weakTopics: number
  dueLessons: number
  essentialWordsDue: number
  chunksDue?: number
  /** Items the Repaso session itself can execute (has real exercises for). */
  executable: number
  /** Items counted but practiced on their own surface (Essential Words, Inmersión); Repaso only links to them. */
  elsewhere: number
  total: number
}

export type ReviewHubCounts = ReviewQueueCounts

export interface ReviewSessionCandidates {
  failedSentences: FailedSentenceItem[]
  weakWords: WordBankEntry[]
  dueWords: WordBankEntry[]
  soundsDue: SoundDueHome[]
  dueTopics: TopicSrsRow[]
  weakTopics: TopicSrsRow[]
  dueLessons: LessonReviewItem[]
  essentialWordsDue: EssentialWordReviewItem[]
  chunksDue?: unknown[]
}

export interface ReviewHubSummary {
  failedSentences: FailedSentenceItem[]
  weakWords: WordBankEntry[]
  dueWords: WordBankEntry[]
  soundsDue: SoundDueHome[]
  dueTopics: TopicSrsRow[]
  weakTopics: TopicSrsRow[]
  dueLessons: LessonReviewItem[]
  essentialWordsDue: EssentialWordReviewItem[]
  /** Exact queue counts across all review categories */
  queueCounts?: ReviewQueueCounts
  /** Session candidate items */
  sessionCandidates?: ReviewSessionCandidates
  counts: ReviewHubCounts
  /** No sections with items to show. */
  nothingDue: boolean
  /** At least one step can be built for "Iniciar repaso completo". */
  canStartReview: boolean
}

export type SrsHistoryDomain = 'words' | 'sounds' | 'sentences' | 'topics'

export interface SrsHistoryItem {
  id: string
  domain: SrsHistoryDomain
  label: string
  sublabel?: string
  intervalDays: number
  nextReviewAt: string | null
  lastPracticedAt: string
}

export interface SrsHistoryGroup {
  domain: SrsHistoryDomain
  title: string
  items: SrsHistoryItem[]
}
