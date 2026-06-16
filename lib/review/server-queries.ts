import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSoundsDueForHome } from '@/lib/home/queries'
import {
  getWeakWordsForReviewServer,
  getWordsDueForReview,
} from '@/lib/word-bank/server-queries'
import type { FailedSentenceItem, ReviewHubSummary } from '@/lib/review/types'

const SENTENCE_EXERCISE_IDS = [5, 6, 8]

type HistoryRow = {
  content_id: string | null
  answered_at: string | null
  target_word: string | null
  exercise_types: { slug: string } | null
}

async function loadFailedSentenceItemsServer(
  userId: string,
  limit: number,
): Promise<FailedSentenceItem[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('answer_history')
    .select('content_id, exercise_type_id, answered_at, target_word, exercise_types(slug)')
    .eq('user_id', userId)
    .eq('is_correct', false)
    .in('exercise_type_id', SENTENCE_EXERCISE_IDS)
    .order('answered_at', { ascending: false })
    .limit(50)

  if (error || !data) return []

  const seen = new Set<string>()
  const items: FailedSentenceItem[] = []
  for (const row of data as HistoryRow[]) {
    const contentId = row.content_id
    if (!contentId || seen.has(contentId)) continue
    seen.add(contentId)
    const wordBankId = contentId.startsWith('word_bank:')
      ? contentId.slice('word_bank:'.length)
      : /^[0-9a-f-]{36}$/i.test(contentId)
        ? contentId
        : null
    items.push({
      contentId,
      wordBankId,
      slug: row.exercise_types?.slug ?? 'sentence',
      label: row.target_word ?? contentId,
      failedAt: row.answered_at ?? new Date().toISOString(),
    })
    if (items.length >= limit) break
  }
  return items
}

/** Server: full hub summary for `/practice/review`. */
export async function getReviewHubSummary(userId: string): Promise<ReviewHubSummary> {
  const [failedSentences, weakWords, dueWords, soundsDue] = await Promise.all([
    loadFailedSentenceItemsServer(userId, 5),
    getWeakWordsForReviewServer(userId, 6),
    getWordsDueForReview(userId, 6),
    getSoundsDueForHome(userId),
  ])

  const counts = {
    failedSentences: failedSentences.length,
    weakWords: weakWords.length,
    dueWords: dueWords.length,
    soundsDue: soundsDue.length,
    total:
      failedSentences.length +
      weakWords.length +
      dueWords.length +
      soundsDue.length,
  }

  return {
    failedSentences,
    weakWords,
    dueWords,
    soundsDue,
    counts,
    nothingDue: counts.total === 0,
  }
}
