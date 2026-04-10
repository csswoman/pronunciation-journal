/**
 * Offline-first write helpers for phoneme practice data.
 *
 * Each function uses a Dexie transaction to atomically:
 *   1. Write the data to a local Dexie cache table (fast, always works)
 *   2. Enqueue the same change to syncOutbox (persisted for later upload)
 *
 * The sync manager flushes the queue to Supabase when connectivity allows.
 * Call these instead of the direct Supabase mutations in queries.ts.
 */

import { db } from '@/lib/db'
import { enqueue, flushOutbox } from './sync-manager'
import type { SessionAnswer, SRResult } from '@/lib/phoneme-practice/types'

// ── Local cache tables (lightweight mirrors of Supabase rows) ─────────────
// These are stored in Dexie so the app stays functional offline.
// They are NOT the authoritative source — Supabase is. They exist only to
// avoid blocking the UI while the outbox is being flushed.

export interface LocalSoundProgress {
  /** Composite key: `${userId}:${soundId}` */
  localKey: string
  userId: string
  soundId: number
  totalAttempts: number
  correctAnswers: number
  streak: number
  bestStreak: number
  easeFactor: number
  intervalDays: number
  lastPracticed: string
  nextReview: string
  status: string
  updatedAt: string
}

export interface LocalAnswerHistory {
  id?: number
  userId: string
  soundId: number
  exerciseTypeSlug: string
  isCorrect: boolean
  userAnswer: string
  targetWord: string | null
  timeMs: number
  exercisePayload: Record<string, unknown> | null
  answeredAt: string
  /** True once the row has been confirmed by Supabase */
  synced: boolean
}

// ── Dexie version bump: add cache tables ──────────────────────────────────
// These tables are added in db.ts v6. The declarations here are for typing.
// Access them via db.table() to avoid circular imports during migration.

function localProgressTable() {
  return db.table<LocalSoundProgress, string>('localSoundProgress')
}

function localAnswerTable() {
  return db.table<LocalAnswerHistory, number>('localAnswerHistory')
}

// ── save answers (offline-first) ──────────────────────────────────────────

/**
 * Save a batch of session answers locally and enqueue them for Supabase sync.
 *
 * The Dexie transaction guarantees that either BOTH the local cache write
 * AND the outbox entry are saved, or neither is — preventing ghost answers
 * in the queue without a local record (or vice-versa).
 */
export async function saveAnswersOfflineFirst(
  userId: string,
  answers: SessionAnswer[],
  exerciseTypeIds: Record<string, number>
): Promise<void> {
  const answeredAt = new Date().toISOString()

  await db.transaction('rw', [localAnswerTable(), db.syncOutbox], async () => {
    for (const a of answers) {
      // 1. Write to local cache
      await localAnswerTable().add({
        userId,
        soundId: a.soundId,
        exerciseTypeSlug: a.exerciseType,
        isCorrect: a.isCorrect,
        userAnswer: a.userAnswer,
        targetWord: a.targetWord ?? null,
        timeMs: a.timeMs,
        exercisePayload: (a.exercisePayload ?? null) as Record<string, unknown> | null,
        answeredAt,
        synced: false,
      })

      // 2. Enqueue for Supabase (uses exercise_type_id, not slug)
      const exerciseTypeId = exerciseTypeIds[a.exerciseType]
      if (exerciseTypeId !== undefined) {
        await enqueue('answer_history', 'insert', {
          user_id: userId,
          sound_id: a.soundId,
          exercise_type_id: exerciseTypeId,
          is_correct: a.isCorrect,
          user_answer: a.userAnswer,
          target_word: a.targetWord ?? null,
          time_ms: a.timeMs,
          exercise_payload: (a.exercisePayload ?? null) as Record<string, unknown> | null,
          answered_at: answeredAt,
        })
      }
    }
  })

  // Opportunistic flush — no await, runs in background
  if (navigator.onLine) flushOutbox().catch(console.error)
}

// ── update progress (offline-first) ───────────────────────────────────────

/**
 * Update `user_sound_progress` locally and enqueue an upsert for Supabase.
 *
 * The `currentProgress` snapshot must be passed in by the caller (fetched
 * from Supabase or from the local cache before this write) so we can
 * calculate the new cumulative values offline.
 */
export async function updateProgressOfflineFirst(
  userId: string,
  soundId: number,
  sessionCorrect: number,
  sessionTotal: number,
  sr: SRResult,
  currentProgress: {
    total_attempts?: number
    correct_answers?: number
    best_streak?: number
    status?: string
  } | null
): Promise<void> {
  const newTotal = (currentProgress?.total_attempts ?? 0) + sessionTotal
  const newCorrect = (currentProgress?.correct_answers ?? 0) + sessionCorrect
  const newBestStreak = Math.max(currentProgress?.best_streak ?? 0, sr.streak)
  const accuracy = newTotal > 0 ? newCorrect / newTotal : 0
  const currentStatus = currentProgress?.status ?? 'available'
  const status =
    currentStatus === 'mastered' ? 'mastered' : accuracy >= 0.5 ? 'practicing' : 'available'

  const lastPracticed = new Date().toISOString()
  const nextReview = sr.next_review.toISOString()
  const localKey = `${userId}:${soundId}`

  const progressRow: LocalSoundProgress = {
    localKey,
    userId,
    soundId,
    totalAttempts: newTotal,
    correctAnswers: newCorrect,
    streak: sr.streak,
    bestStreak: newBestStreak,
    easeFactor: sr.ease_factor,
    intervalDays: sr.interval_days,
    lastPracticed,
    nextReview,
    status,
    updatedAt: lastPracticed,
  }

  const supabasePayload = {
    user_id: userId,
    sound_id: soundId,
    total_attempts: newTotal,
    correct_answers: newCorrect,
    streak: sr.streak,
    best_streak: newBestStreak,
    ease_factor: sr.ease_factor,
    interval_days: sr.interval_days,
    last_practiced: lastPracticed,
    next_review: nextReview,
    status,
  }

  await db.transaction('rw', [localProgressTable(), db.syncOutbox], async () => {
    // 1. Update local cache (put = insert-or-replace by localKey)
    await localProgressTable().put(progressRow)

    // 2. Enqueue upsert for Supabase
    await enqueue('user_sound_progress', 'upsert', supabasePayload, {
      user_id: userId,
      sound_id: soundId,
    })
  })

  // Opportunistic flush
  if (navigator.onLine) flushOutbox().catch(console.error)
}

// ── Read from local cache (fallback) ──────────────────────────────────────

/**
 * Read progress from the local cache for a specific user+sound.
 * Useful as a fallback when Supabase is unreachable.
 */
export async function getLocalProgress(
  userId: string,
  soundId: number
): Promise<LocalSoundProgress | undefined> {
  return localProgressTable().get(`${userId}:${soundId}`)
}

/**
 * Get all local progress rows for a user, sorted by last practiced.
 */
export async function getAllLocalProgress(userId: string): Promise<LocalSoundProgress[]> {
  return localProgressTable()
    .where('userId')
    .equals(userId)
    .sortBy('lastPracticed')
}
