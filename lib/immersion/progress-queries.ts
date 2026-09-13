// Progreso de inmersión: espejo Dexie ⇄ Supabase, mismo patrón que
// lib/courses/queries.ts para completedLessons.
import { db, type ImmersionLessonProgressRecord } from '@/lib/db'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

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
  quizScore?: number,
): Promise<void> {
  const now = new Date().toISOString()
  const record: ImmersionLessonProgressRecord = {
    key: progressKey(userId, lessonId),
    userId,
    lessonId,
    watched: true,
    watchedAt: now,
    quizScore,
    updatedAt: now,
  }

  await db.immersionLessonProgress.put(record)

  const { error } = await getSupabaseBrowserClient().from('immersion_lesson_progress').upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      watched: true,
      watched_at: now,
      quiz_score: quizScore ?? null,
      updated_at: now,
    },
    { onConflict: 'user_id,lesson_id' },
  )
  if (error) throw error
}
