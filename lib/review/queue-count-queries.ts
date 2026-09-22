import { createSupabaseServerClient } from '@/lib/supabase/server'
import { countWordsDueForReview } from '@/lib/word-bank/server-queries'
import { SENTENCE_EXERCISE_IDS } from '@/lib/review/failed-sentences-core'
import { countUnredeemedFailures, type AnswerTimestampRow } from '@/lib/review/failed-count-core'
import type { ReviewQueueCounts } from '@/lib/review/types'

const LESSON_REVIEW_INTERVAL_DAYS = 7

export async function countWeakWordsServer(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const { count, error } = await supabase
    .from('word_bank')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'ready')
    .in('srs_status', ['new', 'learning'])

  if (error) {
    console.error('[review] countWeakWordsServer failed', error)
    return 0
  }
  return count ?? 0
}

async function countReviewableWordsServer(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const today = new Date().toISOString()
  const { count, error } = await supabase
    .from('word_bank')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'ready')
    .or(`srs_status.in.(new,learning),and(srs_status.neq.new,next_review_at.lte.${today}),verification_due_at.lte.${today}`)

  if (error) {
    console.error('[review] countReviewableWordsServer failed', error)
    return 0
  }
  return count ?? 0
}

export async function countDueTopicsServer(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const today = new Date().toISOString()
  const { count, error } = await supabase
    .from('topic_srs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('srs_status', ['review', 'mastered'])
    .lte('next_review_at', today)

  if (error) {
    console.error('[review] countDueTopicsServer failed', error)
    return 0
  }
  return count ?? 0
}

export async function countWeakTopicsServer(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const { count, error } = await supabase
    .from('topic_srs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('srs_status', ['new', 'learning'])

  if (error) {
    console.error('[review] countWeakTopicsServer failed', error)
    return 0
  }
  return count ?? 0
}

async function countReviewableTopicsServer(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const today = new Date().toISOString()
  const { count, error } = await supabase
    .from('topic_srs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .or(`srs_status.in.(new,learning),and(srs_status.in.(review,mastered),next_review_at.lte.${today})`)

  if (error) {
    console.error('[review] countReviewableTopicsServer failed', error)
    return 0
  }
  return count ?? 0
}

export async function countDueLessonsServer(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const cutoff = new Date(Date.now() - LESSON_REVIEW_INTERVAL_DAYS * 86_400_000).toISOString()
  const { count, error } = await supabase
    .from('immersion_lesson_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('watched', true)
    .lte('updated_at', cutoff)

  if (error) {
    console.error('[review] countDueLessonsServer failed', error)
    return 0
  }
  return count ?? 0
}

export async function countDueEssentialWordsServer(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const today = new Date().toISOString()
  const { count, error } = await supabase
    .from('learning_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('suspended', false)
    .not('due_at', 'is', null)
    .lte('due_at', today)

  if (error) {
    console.error('[review] countDueEssentialWordsServer failed', error)
    return 0
  }
  return count ?? 0
}

export async function countUnredeemedFailedSentencesServer(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const pageSize = 1_000
  const failures: AnswerTimestampRow[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('answer_history')
      .select('content_id, answered_at')
      .eq('user_id', userId)
      .eq('is_correct', false)
      .in('exercise_type_id', [...SENTENCE_EXERCISE_IDS])
      .order('answered_at', { ascending: false })
      .range(from, from + pageSize - 1)
    if (error) {
      console.error('[review] failed-sentence pagination failed', error)
      return 0
    }
    failures.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }

  const contentIds = [...new Set(failures.flatMap((row) => row.content_id ? [row.content_id] : []))]
  if (contentIds.length === 0) return 0

  const successes: AnswerTimestampRow[] = []
  const batchSize = 100
  for (let start = 0; start < contentIds.length; start += batchSize) {
    const batch = contentIds.slice(start, start + batchSize)
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await supabase
        .from('answer_history')
        .select('content_id, answered_at')
        .eq('user_id', userId)
        .eq('is_correct', true)
        .in('content_id', batch)
        .order('answered_at', { ascending: false })
        .range(from, from + pageSize - 1)
      if (error) {
        console.error('[review] failed-sentence redemption query failed', error)
        return 0
      }
      successes.push(...(data ?? []))
      if (!data || data.length < pageSize) break
    }
  }

  return countUnredeemedFailures(failures, successes)
}

export async function fetchExactReviewQueueCounts(
  userId: string,
  options?: { soundsDueCount?: number; chunksDueCount?: number },
): Promise<ReviewQueueCounts> {
  const [failedSentences, weakWords, dueWords, reviewableWords, dueTopics, weakTopics, reviewableTopics, dueLessons, essentialWordsDue] =
    await Promise.all([
      countUnredeemedFailedSentencesServer(userId),
      countWeakWordsServer(userId),
      countWordsDueForReview(userId),
      countReviewableWordsServer(userId),
      countDueTopicsServer(userId),
      countWeakTopicsServer(userId),
      countReviewableTopicsServer(userId),
      countDueLessonsServer(userId),
      countDueEssentialWordsServer(userId),
    ])

  const soundsDue = options?.soundsDueCount ?? 0
  const chunksDue = options?.chunksDueCount ?? 0

  // `elsewhere` items are practiced on their own surface (Essential Words, Inmersión);
  // Repaso only links to them, so they don't count toward what the session can execute.
  const executable = failedSentences + reviewableWords + soundsDue + reviewableTopics + chunksDue
  const elsewhere = dueLessons + essentialWordsDue

  return {
    failedSentences,
    weakWords,
    dueWords,
    soundsDue,
    dueTopics,
    weakTopics,
    dueLessons,
    essentialWordsDue,
    chunksDue,
    executable,
    elsewhere,
    total: executable + elsewhere,
  }
}
