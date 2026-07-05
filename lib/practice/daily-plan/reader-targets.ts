import { getMyWords } from '@/lib/word-bank/queries'
import type { ReaderTargetRow } from '@/lib/practice/reader/select-targets'

/** Maps word_bank rows to reader target candidates for the daily plan. */
export async function fetchReaderTargetRows(): Promise<ReaderTargetRow[]> {
  const words = await getMyWords()
  return words.map((w) => ({
    srsId: `wb:${w.id}`,
    word: w.text,
    status: w.srs_status ?? 'new',
    nextReview: w.next_review_at ?? '',
  }))
}
