import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getWordBankEntriesByIds } from '@/lib/word-bank/queries'
import {
  resolveFailedSentenceLookups,
  rowsToFailedItems,
  SENTENCE_EXERCISE_IDS,
  type FailedHistoryRow,
} from '@/lib/review/failed-sentences-core'
import type { FailedSentenceItem } from '@/lib/review/types'

/** Recent failed sentence drills (deduped by content_id). */
export async function fetchRecentFailedSentences(
  userId: string,
  limit = 5,
): Promise<FailedSentenceItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('answer_history')
    .select('content_id, exercise_type_id, answered_at, target_word, user_answer, exercise_types(slug)')
    .eq('user_id', userId)
    .eq('is_correct', false)
    .in('exercise_type_id', [...SENTENCE_EXERCISE_IDS])
    .order('answered_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  const rows = data as FailedHistoryRow[]
  const { fragments, words } = await resolveFailedSentenceLookups(
    rows,
    async (ids) => {
      const { data: fragments } = await supabase
        .from('text_fragments')
        .select('id, content, title')
        .in('id', ids)
      return fragments ?? []
    },
    async (ids) => {
      const { data: bankWords } = await supabase
        .from('word_bank')
        .select('id, text, example')
        .in('id', ids)
      return bankWords ?? []
    },
  )

  return rowsToFailedItems(rows, limit, fragments, words)
}

/** Load word_bank rows referenced by failed sentence items. */
export async function fetchFailedSentenceWords(
  items: FailedSentenceItem[],
): Promise<import('@/lib/word-bank/types').WordBankEntry[]> {
  const ids = items.map((i) => i.wordBankId).filter((id): id is string => id != null)
  return getWordBankEntriesByIds(ids)
}

/**
 * Count word_bank SRS items whose next review falls within the next 24h.
 * Returns 0 on error so the recap card degrades gracefully offline.
 */
export async function fetchDueTomorrowCount(userId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient()
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { count, error } = await supabase
    .from('word_bank')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('next_review_at', 'is', null)
    .lte('next_review_at', tomorrow)

  if (error || count == null) return 0
  return count
}
