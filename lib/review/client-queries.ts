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

/** A grammar topic overdue for SRS review, ordered by how overdue it is. */
export interface DueTopic {
  topic: string
  nextReviewAt: string
}

/**
 * Overdue grammar topics (`topic_srs`, same condition as countDueTopicsServer).
 * Returns [] on error so the daily plan degrades gracefully offline.
 */
export async function fetchDueTopics(userId: string, limit = 3): Promise<DueTopic[]> {
  const supabase = getSupabaseBrowserClient()
  const today = new Date().toISOString()

  const { data, error } = await supabase
    .from('topic_srs')
    .select('topic, next_review_at')
    .eq('user_id', userId)
    .in('srs_status', ['review', 'mastered'])
    .lte('next_review_at', today)
    .order('next_review_at', { ascending: true })
    .limit(limit)

  if (error || !data) return []
  return data
    .filter((row): row is { topic: string; next_review_at: string } => !!row.topic && !!row.next_review_at)
    .map((row) => ({ topic: row.topic, nextReviewAt: row.next_review_at }))
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

import { countWordsDueForReviewClient } from '@/lib/word-bank/queries'
import { countDueChunks } from '@/lib/chunk-of-day/queries'
import type { AggregatedReviewSummary } from './summary-types'

export async function fetchAggregatedReviewSummaryClient(
  userId: string,
): Promise<AggregatedReviewSummary> {
  const supabase = getSupabaseBrowserClient()
  const today = new Date().toISOString()

  const getEssentialWordsDueCount = async (): Promise<number> => {
    try {
      const { count } = await supabase
        .from('learning_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('suspended', false)
        .not('due_at', 'is', null)
        .lte('due_at', today)
      return count ?? 0
    } catch {
      return 0
    }
  }

  const getTopicsDueCount = async (): Promise<number> => {
    try {
      const { count } = await supabase
        .from('topic_srs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('srs_status', 'new')
        .lte('next_review_at', today)
      return count ?? 0
    } catch {
      return 0
    }
  }

  const [wordsDue, chunksDue, essentialWordsResult, topicsResult] = await Promise.all([
    countWordsDueForReviewClient(userId).catch(() => 0),
    countDueChunks(userId).catch(() => 0),
    getEssentialWordsDueCount(),
    getTopicsDueCount(),
  ])

  const totalDue = wordsDue + chunksDue + essentialWordsResult + topicsResult
  const hasPendingReview = totalDue > 0

  let primaryQueue: AggregatedReviewSummary['primaryQueue'] = null
  let headline = 'Todo al día'
  let subtext = 'No tienes repasos pendientes por ahora.'

  if (wordsDue > 0) {
    primaryQueue = 'words'
    headline = `${wordsDue} ${wordsDue === 1 ? 'palabra espera' : 'palabras esperan'} repaso`
    subtext = 'Repasarlas hoy las mantiene en memoria a largo plazo · unos 5 min'
  } else if (essentialWordsResult > 0) {
    primaryQueue = 'essential_words'
    headline = `${essentialWordsResult} palabras esenciales esperan repaso`
    subtext = 'Afianza vocabulario de alta frecuencia para hablar con soltura.'
  } else if (topicsResult > 0) {
    primaryQueue = 'topics'
    headline = `${topicsResult} temas gramaticales esperan repaso`
    subtext = 'Refuerza los conceptos antes de que se olviden.'
  } else if (chunksDue > 0) {
    primaryQueue = 'chunks'
    headline = `${chunksDue} expresiones esperan repaso`
    subtext = 'Recupera chunks para mayor naturalidad.'
  }

  return {
    hasPendingReview,
    totalDue,
    queueCounts: {
      failedSentences: 0,
      weakWords: 0,
      dueWords: wordsDue,
      soundsDue: 0,
      dueTopics: topicsResult,
      weakTopics: 0,
      dueLessons: 0,
      essentialWordsDue: essentialWordsResult,
      chunksDue,
      reviewable: totalDue,
      total: totalDue,
    },
    primaryQueue,
    headline,
    subtext,
  }
}
