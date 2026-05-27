import type { WordBankEntry } from '@/lib/word-bank/types'

export type FlashcardRating = 'forgot' | 'normal' | 'known'

export interface WordRating {
  entry: WordBankEntry
  rating: FlashcardRating
}
