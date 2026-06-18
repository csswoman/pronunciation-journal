import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSoundsDueForHome } from '@/lib/home/queries'
import {
  getWeakWordsForReviewServer,
  getWordsDueForReview,
} from '@/lib/word-bank/server-queries'
import {
  buildReviewHubCounts,
  computeCanStartReview,
  resolveFailedSentenceLookups,
  rowsToFailedItems,
  SENTENCE_EXERCISE_IDS,
  type FailedHistoryRow,
} from '@/lib/review/failed-sentences-core'
import type { ReviewHubSummary } from '@/lib/review/types'
import { getSrsHistory } from '@/lib/review/srs-history-queries'

async function loadFailedSentenceItemsServer(
  userId: string,
  limit: number,
): Promise<import('@/lib/review/types').FailedSentenceItem[]> {
  const supabase = await createSupabaseServerClient()
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

  // Find the most recent failure timestamp per content_id so we can check
  // if the user has since answered it correctly (i.e. "redeemed" it).
  const latestFailAt = new Map<string, string>()
  for (const row of rows) {
    if (!row.content_id || !row.answered_at) continue
    if (!latestFailAt.has(row.content_id)) latestFailAt.set(row.content_id, row.answered_at)
  }

  const contentIds = [...latestFailAt.keys()]
  let redeemedIds = new Set<string>()

  if (contentIds.length > 0) {
    const { data: successes } = await supabase
      .from('answer_history')
      .select('content_id, answered_at')
      .eq('user_id', userId)
      .eq('is_correct', true)
      .in('content_id', contentIds)

    for (const row of successes ?? []) {
      if (!row.content_id || !row.answered_at) continue
      const failedAt = latestFailAt.get(row.content_id)
      if (failedAt && row.answered_at > failedAt) redeemedIds.add(row.content_id)
    }
  }

  const unredeemed = rows.filter((r) => r.content_id && !redeemedIds.has(r.content_id))

  const { fragments, words } = await resolveFailedSentenceLookups(
    unredeemed,
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
  return rowsToFailedItems(unredeemed, limit, fragments, words)
}

/** Server: full hub summary for `/practice/review`. */
export async function getReviewHubSummary(userId: string): Promise<ReviewHubSummary> {
  const supabase = await createSupabaseServerClient()
  const [failedSentences, weakWords, dueWords, soundsDue, srsHistory] = await Promise.all([
    loadFailedSentenceItemsServer(userId, 5),
    getWeakWordsForReviewServer(userId, 6),
    getWordsDueForReview(userId, 6),
    getSoundsDueForHome(userId),
    getSrsHistory(supabase, userId),
  ])

  const counts = buildReviewHubCounts(failedSentences, weakWords, dueWords, soundsDue)
  const canStartReview = computeCanStartReview({ failedSentences, weakWords, dueWords, soundsDue })

  return {
    failedSentences,
    weakWords,
    dueWords,
    soundsDue,
    counts,
    nothingDue: counts.total === 0,
    canStartReview,
    srsHistory,
  }
}
