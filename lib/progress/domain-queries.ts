import { createSupabaseServerClient } from '@/lib/supabase/server'
import { classifyTopicProgress } from './topic-progress'

export interface TopicProgressRow {
  topic: string
  srsStatus: 'new' | 'learning' | 'review' | 'mastered'
  nextReviewAt: string | null
  lastReviewedAt: string | null
  intervalDays?: number
  repetitions?: number
  easeFactor?: number
}

export interface CompletedLessonRow {
  courseSlug: string
  lessonSlug: string
  completedAt: string
}

export interface ImmersionProgressData {
  watched: number
  completed: number
  due: number
  total: number
}

export interface ProgressDomainData {
  topics: TopicProgressRow[]
  completedRoute: CompletedLessonRow[]
  learningTopics: TopicProgressRow[]
  masteredTopics: TopicProgressRow[]
  immersion: ImmersionProgressData
}

const IMMERSION_REVIEW_INTERVAL_DAYS = 7

export async function getProgressDomainData(userId: string): Promise<ProgressDomainData> {
  const supabase = await createSupabaseServerClient()
  const cutoff = new Date(Date.now() - IMMERSION_REVIEW_INTERVAL_DAYS * 86_400_000).toISOString()

  const [topicsResult, immersionResult, immersionTotalResult, lessonCompletionsResult] = await Promise.all([
    supabase
      .from('topic_srs')
      .select('topic, srs_status, next_review_at, last_reviewed_at, interval_days, repetitions, ease_factor')
      .eq('user_id', userId),
    supabase
      .from('immersion_lesson_progress')
      .select('watched, quiz_score, updated_at')
      .eq('user_id', userId),
    supabase
      .from('immersion_lessons')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('lesson_completions')
      .select('course_slug, lesson_slug, completed_at')
      .eq('user_id', userId),
  ])

  if (topicsResult.error) console.error('[progress] topic_srs query failed', topicsResult.error)
  if (immersionResult.error) console.error('[progress] immersion progress query failed', immersionResult.error)
  if (immersionTotalResult.error) console.error('[progress] immersion total query failed', immersionTotalResult.error)
  if (lessonCompletionsResult.error) console.error('[progress] lesson_completions query failed', lessonCompletionsResult.error)

  const topics: TopicProgressRow[] = (topicsResult.data ?? []).map((row) => ({
    topic: row.topic,
    srsStatus: row.srs_status as TopicProgressRow['srsStatus'],
    nextReviewAt: row.next_review_at,
    lastReviewedAt: row.last_reviewed_at,
    intervalDays: row.interval_days ?? undefined,
    repetitions: row.repetitions ?? undefined,
    easeFactor: row.ease_factor ?? undefined,
  }))

  const completedRoute: CompletedLessonRow[] = (lessonCompletionsResult.data ?? []).map((row) => ({
    courseSlug: row.course_slug,
    lessonSlug: row.lesson_slug,
    completedAt: row.completed_at,
  }))

  const { learningTopics, masteredTopics } = classifyTopicProgress(topics)

  const immersionRows = immersionResult.data ?? []
  const watched = immersionRows.filter((row) => row.watched).length
  const completed = immersionRows.filter((row) => row.quiz_score != null && row.quiz_score >= 70).length
  const due = immersionRows.filter((row) => row.watched && row.updated_at <= cutoff).length

  return {
    topics,
    completedRoute,
    learningTopics,
    masteredTopics,
    immersion: {
      watched,
      completed,
      due,
      total: immersionTotalResult.count ?? 0,
    },
  }
}
