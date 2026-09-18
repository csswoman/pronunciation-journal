import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface TopicProgressRow {
  topic: string
  srsStatus: 'new' | 'learning' | 'review' | 'mastered'
  nextReviewAt: string | null
  lastReviewedAt: string | null
}

export interface ImmersionProgressData {
  watched: number
  completed: number
  due: number
  total: number
}

export interface ProgressDomainData {
  topics: TopicProgressRow[]
  immersion: ImmersionProgressData
}

const IMMERSION_REVIEW_INTERVAL_DAYS = 7

export async function getProgressDomainData(userId: string): Promise<ProgressDomainData> {
  const supabase = await createSupabaseServerClient()
  const cutoff = new Date(Date.now() - IMMERSION_REVIEW_INTERVAL_DAYS * 86_400_000).toISOString()

  const [topicsResult, immersionResult, immersionTotalResult] = await Promise.all([
    supabase
      .from('topic_srs')
      .select('topic, srs_status, next_review_at, last_reviewed_at')
      .eq('user_id', userId),
    supabase
      .from('immersion_lesson_progress')
      .select('watched, quiz_score, updated_at')
      .eq('user_id', userId),
    supabase
      .from('immersion_lessons')
      .select('id', { count: 'exact', head: true }),
  ])

  if (topicsResult.error) console.error('[progress] topic_srs query failed', topicsResult.error)
  if (immersionResult.error) console.error('[progress] immersion progress query failed', immersionResult.error)
  if (immersionTotalResult.error) console.error('[progress] immersion total query failed', immersionTotalResult.error)

  const topics = (topicsResult.data ?? []).map((row) => ({
    topic: row.topic,
    srsStatus: row.srs_status as TopicProgressRow['srsStatus'],
    nextReviewAt: row.next_review_at,
    lastReviewedAt: row.last_reviewed_at,
  }))

  const immersionRows = immersionResult.data ?? []
  const watched = immersionRows.filter((row) => row.watched).length
  const completed = immersionRows.filter((row) => row.quiz_score != null && row.quiz_score >= 70).length
  const due = immersionRows.filter((row) => row.watched && row.updated_at <= cutoff).length

  return {
    topics,
    immersion: {
      watched,
      completed,
      due,
      total: immersionTotalResult.count ?? 0,
    },
  }
}
