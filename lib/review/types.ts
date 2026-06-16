import type { SoundDueHome } from '@/lib/home/constants'
import type { WordBankEntry } from '@/lib/word-bank/types'

export interface FailedSentenceItem {
  contentId: string
  wordBankId: string | null
  slug: string
  label: string
  failedAt: string
}

export interface ReviewHubCounts {
  failedSentences: number
  weakWords: number
  dueWords: number
  soundsDue: number
  total: number
}

export interface ReviewHubSummary {
  failedSentences: FailedSentenceItem[]
  weakWords: WordBankEntry[]
  dueWords: WordBankEntry[]
  soundsDue: SoundDueHome[]
  counts: ReviewHubCounts
  nothingDue: boolean
}
