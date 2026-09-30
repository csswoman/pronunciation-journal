import { createSupabaseServerClient } from '@/lib/supabase/server'
import { countWordsDueForReview } from '@/lib/word-bank/server-queries'
import { SENTENCE_EXERCISE_IDS } from '@/lib/review/failed-sentences-core'
import { countUnredeemedFailures, type AnswerTimestampRow } from '@/lib/review/failed-count-core'
import { toLocalDateString, STREAK_TIMEZONE } from '@/lib/daily/streak-core'
import type { ReviewForecastCounts, ReviewQueueCounts } from '@/lib/review/types'

const LESSON_REVIEW_INTERVAL_DAYS = 7
const FORECAST_DAYS = 7
const OVERDUE_ONE_WEEK_MS = 7 * 86_400_000

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

/** Real count of word_bank/topic_srs rows overdue by more than 7 days. Sounds are passed in from the caller (already loaded client-side). */
async function countOverdueOneWeekServer(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const cutoff = new Date(Date.now() - OVERDUE_ONE_WEEK_MS).toISOString()

  const [wordsResult, topicsResult] = await Promise.all([
    supabase
      .from('word_bank')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'ready')
      .neq('srs_status', 'new')
      .lte('next_review_at', cutoff),
    supabase
      .from('topic_srs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('srs_status', ['review', 'mastered'])
      .lte('next_review_at', cutoff),
  ])

  if (wordsResult.error) console.error('[review] countOverdueOneWeekServer words failed', wordsResult.error)
  if (topicsResult.error) console.error('[review] countOverdueOneWeekServer topics failed', topicsResult.error)

  return (wordsResult.count ?? 0) + (topicsResult.count ?? 0)
}

/**
 * Real forecast of the next 7 days: for each day, how many word_bank rows and
 * topic_srs rows have `next_review_at` due that day (today's bucket also
 * absorbs anything already overdue). Sounds and chunks are not scheduled by a
 * per-day timestamp in the same way, so they are not included — the card only
 * claims what it can back with a date.
 */
async function buildReviewForecastServer(userId: string): Promise<ReviewForecastCounts> {
  const supabase = await createSupabaseServerClient()
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const horizon = new Date(startOfToday)
  horizon.setDate(horizon.getDate() + FORECAST_DAYS)

  const [wordsResult, topicsResult] = await Promise.all([
    supabase
      .from('word_bank')
      .select('next_review_at')
      .eq('user_id', userId)
      .eq('status', 'ready')
      .neq('srs_status', 'new')
      .lt('next_review_at', horizon.toISOString()),
    supabase
      .from('topic_srs')
      .select('next_review_at')
      .eq('user_id', userId)
      .in('srs_status', ['review', 'mastered'])
      .lt('next_review_at', horizon.toISOString()),
  ])

  if (wordsResult.error) console.error('[review] buildReviewForecastServer words failed', wordsResult.error)
  if (topicsResult.error) console.error('[review] buildReviewForecastServer topics failed', topicsResult.error)

  const rows = [...(wordsResult.data ?? []), ...(topicsResult.data ?? [])]
  const counts = new Array(FORECAST_DAYS).fill(0) as ReviewForecastCounts
  const todayKey = toLocalDateString(startOfToday.toISOString(), STREAK_TIMEZONE)

  for (const row of rows) {
    if (!row.next_review_at) continue
    const dueKey = toLocalDateString(row.next_review_at, STREAK_TIMEZONE)
    if (dueKey <= todayKey) {
      counts[0] += 1
      continue
    }
    const dueDate = new Date(`${dueKey}T12:00:00`)
    const todayDate = new Date(`${todayKey}T12:00:00`)
    const dayIndex = Math.round((dueDate.getTime() - todayDate.getTime()) / 86_400_000)
    if (dayIndex >= 0 && dayIndex < FORECAST_DAYS) counts[dayIndex] += 1
  }

  return counts
}

export async function fetchExactReviewQueueCounts(
  userId: string,
  options?: { soundsDueCount?: number; chunksDueCount?: number },
): Promise<ReviewQueueCounts> {
  const [
    failedSentences,
    weakWords,
    dueWords,
    reviewableWords,
    dueTopics,
    weakTopics,
    reviewableTopics,
    dueLessons,
    essentialWordsDue,
    overdueOneWeek,
  ] = await Promise.all([
    countUnredeemedFailedSentencesServer(userId),
    countWeakWordsServer(userId),
    countWordsDueForReview(userId),
    countReviewableWordsServer(userId),
    countDueTopicsServer(userId),
    countWeakTopicsServer(userId),
    countReviewableTopicsServer(userId),
    countDueLessonsServer(userId),
    countDueEssentialWordsServer(userId),
    countOverdueOneWeekServer(userId),
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
    overdueOneWeek,
  }
}

export async function getWordMasteryStatsServer(userId: string): Promise<{
  newCount: number
  learningCount: number
  reviewCount: number
  masteredCount: number
}> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('word_bank')
    .select('srs_status')
    .eq('user_id', userId)
    .eq('status', 'ready')

  if (error) {
    console.error('[review] getWordMasteryStatsServer failed', error)
    return { newCount: 0, learningCount: 0, reviewCount: 0, masteredCount: 0 }
  }

  let newCount = 0
  let learningCount = 0
  let reviewCount = 0
  let masteredCount = 0
  for (const row of data ?? []) {
    if (row.srs_status === 'new') newCount++
    else if (row.srs_status === 'learning') learningCount++
    else if (row.srs_status === 'review') reviewCount++
    else if (row.srs_status === 'mastered') masteredCount++
  }
  return { newCount, learningCount, reviewCount, masteredCount }
}

export async function getReviewForecast(userId: string): Promise<ReviewForecastCounts> {
  return buildReviewForecastServer(userId)
}
