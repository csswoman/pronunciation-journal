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

export interface ReviewHubCounts {
  failedSentences: number
  weakWords: number
  dueWords: number
  soundsDue: number
  /** Items that can start a review session (excludes display-only failures). */
  reviewable: number
  total: number
}

export interface ReviewHubSummary {
  failedSentences: FailedSentenceItem[]
  weakWords: WordBankEntry[]
  dueWords: WordBankEntry[]
  soundsDue: SoundDueHome[]
  counts: ReviewHubCounts
  /** No sections with items to show. */
  nothingDue: boolean
  /** At least one step can be built for "Iniciar repaso completo". */
  canStartReview: boolean
}
