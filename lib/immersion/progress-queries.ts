// Progreso de inmersión: espejo Dexie ⇄ Supabase, mismo patrón que
// lib/courses/queries.ts para completedLessons.
import { db, type ImmersionLessonProgressRecord } from '@/lib/db'
import { buildSessionResult } from '@/lib/practice/session-result'
import { savePracticeAnswer } from '@/lib/practice/queries'
import type { ExerciseResult } from '@/lib/practice/types'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { enqueue } from '@/lib/sync/sync-manager'

type RemoteImmersionProgress = {
  user_id: string
  lesson_id: string
  watched: boolean
  watched_at: string | null
  quiz_score: number | null
  updated_at: string
}

function progressKey(userId: string, lessonId: string): string {
  return `${userId}:${lessonId}`
}

function toLocalRow(row: RemoteImmersionProgress): ImmersionLessonProgressRecord {
  return {
    key: progressKey(row.user_id, row.lesson_id),
    userId: row.user_id,
    lessonId: row.lesson_id,
    watched: row.watched,
    watchedAt: row.watched_at ?? undefined,
    quizScore: row.quiz_score ?? undefined,
    updatedAt: row.updated_at,
  }
}

/** Refreshes the local mirror of the user's immersion progress. */
export async function hydrateImmersionProgress(userId: string): Promise<void> {
  const { data, error } = await getSupabaseBrowserClient()
    .from('immersion_lesson_progress')
    .select('user_id, lesson_id, watched, watched_at, quiz_score, updated_at')
    .eq('user_id', userId)

  if (error) throw error

  const rows = ((data ?? []) as RemoteImmersionProgress[]).map(toLocalRow)
  await db.immersionLessonProgress.bulkPut(rows)
}

/** Ids of lessons the user has already watched, for excluding from the daily plan. */
export async function loadWatchedImmersionLessonIds(userId: string): Promise<Set<string>> {
  const rows = await db.immersionLessonProgress.where('userId').equals(userId).toArray()
  return new Set(rows.filter((row) => row.watched).map((row) => row.lessonId))
}

export async function loadImmersionProgressMap(
  userId: string,
): Promise<import('./types').ImmersionProgressMap> {
  const rows = await db.immersionLessonProgress.where('userId').equals(userId).toArray()
  const map: import('./types').ImmersionProgressMap = {}
  for (const r of rows) {
    let status: import('./types').ImmersionLessonStatus = 'not_started'
    if (r.quizScore != null) {
      status = r.quizScore >= 70 ? 'completed' : 'in_progress'
    } else if (r.watched) {
      status = 'in_progress'
    }
    map[r.lessonId] = {
      lessonId: r.lessonId,
      watched: r.watched,
      status,
      watchedAt: r.watchedAt,
      quizScore: r.quizScore,
      completedAt: status === 'completed' ? (r.updatedAt ?? r.watchedAt) : undefined,
    }
  }
  return map
}

export async function markImmersionLessonWatched(
  userId: string,
  lessonId: string,
): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', [db.immersionLessonProgress, db.syncOutbox], async () => {
    const existing = await db.immersionLessonProgress.get(progressKey(userId, lessonId))
    const record: ImmersionLessonProgressRecord = {
      key: progressKey(userId, lessonId),
      userId,
      lessonId,
      watched: true,
      watchedAt: now,
      quizScore: existing?.quizScore,
      updatedAt: now,
    }
    await db.immersionLessonProgress.put(record)
    await enqueue(
      userId,
      'immersion_lesson_progress',
      'upsert',
      {
        user_id: userId,
        lesson_id: lessonId,
        watched: true,
        watched_at: now,
        quiz_score: existing?.quizScore ?? null,
        updated_at: now,
      },
      undefined,
      'user_id,lesson_id',
    )
  })
}

/** Stores a quiz score without claiming that the learner watched the video. */
export async function recordImmersionQuizScore(
  userId: string,
  lessonId: string,
  quizScore: number,
): Promise<void> {
  const now = new Date().toISOString()
  await db.transaction('rw', [db.immersionLessonProgress, db.syncOutbox], async () => {
    const existing = await db.immersionLessonProgress.get(progressKey(userId, lessonId))
    const record: ImmersionLessonProgressRecord = {
      key: progressKey(userId, lessonId),
      userId,
      lessonId,
      watched: existing?.watched ?? false,
      watchedAt: existing?.watchedAt,
      quizScore,
      updatedAt: now,
    }
    await db.immersionLessonProgress.put(record)
    await enqueue(
      userId,
      'immersion_lesson_progress',
      'upsert',
      {
        user_id: userId,
        lesson_id: lessonId,
        watched: record.watched,
        watched_at: record.watchedAt ?? null,
        quiz_score: quizScore,
        updated_at: now,
      },
      undefined,
      'user_id,lesson_id',
    )
  })
}

export interface ImmersionQuizAnswerInput {
  questionId: string
  question: string
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  timeMs: number
}

export interface ImmersionQuizAttemptInput {
  attemptId: string
  lessonId: string
  canonicalTopic?: string
  answers: ImmersionQuizAnswerInput[]
}

/**
 * Persists the exact options selected in one completed immersion quiz.
 * A caller-owned attempt id makes retries replay-safe without treating the
 * aggregate quiz score as reconstructed per-question evidence.
 */
export async function recordImmersionQuizAttempt(
  userId: string,
  input: ImmersionQuizAttemptInput,
): Promise<void> {
  const completedAt = new Date()
  const results: ExerciseResult[] = input.answers.map((answer) => ({
    attemptId: `${input.attemptId}:${answer.questionId}`,
    exerciseId: `immersion:${input.lessonId}:${answer.questionId}`,
    slug: 'multiple_choice',
    exerciseTypeId: 17,
    isCorrect: answer.isCorrect,
    userAnswer: answer.selectedAnswer,
    timeMs: answer.timeMs,
    status: 'answered',
    contentId: `immersion:${input.lessonId}:${answer.questionId}`,
    context: 'practice',
    exercisePayload: {
      taskSkill: 'reading',
      immersionLessonId: input.lessonId,
      questionId: answer.questionId,
      question: answer.question,
      correctAnswer: answer.correctAnswer,
    },
    topic: input.canonicalTopic,
    completedAt,
  }))

  await Promise.all(results.map((result) => savePracticeAnswer(userId, result)))

  const hasRecordedSession = await db.syncOutbox
    .where('userId').equals(userId)
    .and((entry) => entry.table === 'activity_sessions' && entry.payload.id === input.attemptId)
    .first()
  if (hasRecordedSession) return

  await recordActivitySession(userId, {
    practiceContext: 'practice',
    source: 'immersion',
    activitySessionId: input.attemptId,
    sessionResult: buildSessionResult(results),
    metadata: { immersionLessonId: input.lessonId },
  })
}
