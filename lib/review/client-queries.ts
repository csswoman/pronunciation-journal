import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getWordBankEntriesByIds } from '@/lib/word-bank/queries'
import { parseWordBankId } from '@/lib/review/parse-content-id'
import type { FailedSentenceItem } from '@/lib/review/types'

const SENTENCE_EXERCISE_IDS = [5, 6, 8]

type HistoryRow = {
  content_id: string | null
  answered_at: string | null
  target_word: string | null
  exercise_types: { slug: string } | null
}

function rowsToFailedItems(rows: HistoryRow[], limit: number): FailedSentenceItem[] {
  const seen = new Set<string>()
  const items: FailedSentenceItem[] = []
  for (const row of rows) {
    const contentId = row.content_id
    if (!contentId || seen.has(contentId)) continue
    seen.add(contentId)
    items.push({
      contentId,
      wordBankId: parseWordBankId(contentId),
      slug: row.exercise_types?.slug ?? 'sentence',
      label: row.target_word ?? contentId,
      failedAt: row.answered_at ?? new Date().toISOString(),
    })
    if (items.length >= limit) break
  }
  return items
}

/** Recent failed sentence drills (deduped by content_id). */
export async function fetchRecentFailedSentences(
  userId: string,
  limit = 5,
): Promise<FailedSentenceItem[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('answer_history')
    .select('content_id, exercise_type_id, answered_at, target_word, exercise_types(slug)')
    .eq('user_id', userId)
    .eq('is_correct', false)
    .in('exercise_type_id', SENTENCE_EXERCISE_IDS)
    .order('answered_at', { ascending: false })
    .limit(50)

  if (error || !data) return []
  return rowsToFailedItems(data as HistoryRow[], limit)
}

/** Load word_bank rows referenced by failed sentence items. */
export async function fetchFailedSentenceWords(
  items: FailedSentenceItem[],
): Promise<import('@/lib/word-bank/types').WordBankEntry[]> {
  const ids = items.map((i) => i.wordBankId).filter((id): id is string => id != null)
  return getWordBankEntriesByIds(ids)
}
