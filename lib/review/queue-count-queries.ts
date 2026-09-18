import { createSupabaseServerClient } from '@/lib/supabase/server'
import { countWordsDueForReview } from '@/lib/word-bank/server-queries'
import { SENTENCE_EXERCISE_IDS } from '@/lib/review/failed-sentences-core'
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
  const { data, error } = await supabase
    .from('answer_history')
    .select('content_id, answered_at')
    .eq('user_id', userId)
    .eq('is_correct', false)
    .in('exercise_type_id', [...SENTENCE_EXERCISE_IDS])
    .order('answered_at', { ascending: false })
    .limit(100)

  if (error || !data || data.length === 0) return 0

  const latestFailAt = new Map<string, string>()
  for (const row of data) {
    if (!row.content_id || !row.answered_at) continue
    if (!latestFailAt.has(row.content_id)) latestFailAt.set(row.content_id, row.answered_at)
  }

  const contentIds = [...latestFailAt.keys()]
  if (contentIds.length === 0) return 0

  const { data: successes } = await supabase
    .from('answer_history')
    .select('content_id, answered_at')
    .eq('user_id', userId)
    .eq('is_correct', true)
    .in('content_id', contentIds)

  const redeemedIds = new Set<string>()
  for (const row of successes ?? []) {
    if (!row.content_id || !row.answered_at) continue
    const failedAt = latestFailAt.get(row.content_id)
    if (failedAt && row.answered_at > failedAt) redeemedIds.add(row.content_id)
  }

  return contentIds.filter((id) => !redeemedIds.has(id)).length
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

  const reviewable =
    failedSentences +
    reviewableWords +
    soundsDue +
    reviewableTopics +
    dueLessons +
    essentialWordsDue +
    chunksDue

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
    reviewable,
    total: reviewable,
  }
}
