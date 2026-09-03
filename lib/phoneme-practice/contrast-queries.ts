import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { db } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import { canonicalizeContrastId } from './phoneme-similarity'
import { canonicalizeProgressRows } from '@/lib/sounds/normalization'
import type { UserContrastProgress, SRResult } from './types'

function supabase() {
  return getSupabaseBrowserClient()
}

export async function getAllContrastProgress(
  userId: string
): Promise<UserContrastProgress[]> {
  try {
    const { data, error } = await supabase()
      .from('user_contrast_progress')
      .select('id, user_id, contrast_id, ease_factor, interval_days, next_review, last_seen, total_attempts, correct_answers, streak, mastery_pct, adaptive_score, observation_count')
      .eq('user_id', userId)
    if (error) throw error
    const canonical = canonicalizeProgressRows(data as unknown as UserContrastProgress[])
    if (typeof indexedDB !== 'undefined') {
      void db.cachedContrastProgress.bulkPut(canonical.map(r => ({
        key: `${userId}:${r.contrast_id}`,
        id: r.id,
        userId: r.user_id,
        contrastId: r.contrast_id,
        easeFactor: r.ease_factor,
        intervalDays: r.interval_days,
        nextReview: r.next_review,
        lastSeen: r.last_seen,
        totalAttempts: r.total_attempts,
        correctAnswers: r.correct_answers,
        streak: r.streak,
        masteryPct: r.mastery_pct,
        adaptiveScore: r.adaptive_score,
        observationCount: r.observation_count,
        updatedAt: new Date().toISOString(),
      }))).catch(() => {})
    }
    return canonical
  } catch (err) {
    if (typeof indexedDB !== 'undefined') {
      const local = await db.cachedContrastProgress.where('userId').equals(userId).toArray().catch(() => [])
      if (local.length > 0) {
        return canonicalizeProgressRows(local.map(r => ({
          id: r.id ?? r.key,
          user_id: r.userId,
          contrast_id: r.contrastId,
          ease_factor: r.easeFactor,
          interval_days: r.intervalDays,
          next_review: r.nextReview,
          last_seen: r.lastSeen,
          total_attempts: r.totalAttempts,
          correct_answers: r.correctAnswers,
          streak: r.streak,
          mastery_pct: r.masteryPct,
          adaptive_score: r.adaptiveScore,
          observation_count: r.observationCount,
        })))
      }
    }
    throw err
  }
}

export async function getRetiredEssentialWordBlankKeys(): Promise<string[]> {
  // Generated database types lag the just-applied migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase().from('essential_word_blank_review_queue' as any)
    .select('sentence_id, token_index').eq('status', 'retired_for_review')
  if (error) throw error
  return ((data ?? []) as unknown as Array<{ sentence_id: string; token_index: number }>).map((row) => `${row.sentence_id}:${row.token_index}`)
}

export async function getContrastProgress(
  userId: string,
  contrastId: string
): Promise<UserContrastProgress | null> {
  const canonicalContrastId = canonicalizeContrastId(contrastId)
  try {
    const { data, error } = await supabase()
      .from('user_contrast_progress')
      .select('id, user_id, contrast_id, ease_factor, interval_days, next_review, last_seen, total_attempts, correct_answers, streak, mastery_pct')
      .eq('user_id', userId)
      .eq('contrast_id', canonicalContrastId)
      .maybeSingle()
    if (error) throw error
    if (data) {
      const canonical = canonicalizeProgressRows([data as UserContrastProgress])[0] ?? null
      if (canonical && typeof indexedDB !== 'undefined') {
        void db.cachedContrastProgress.put({
          key: `${userId}:${canonical.contrast_id}`,
          id: canonical.id,
          userId: canonical.user_id,
          contrastId: canonical.contrast_id,
          easeFactor: canonical.ease_factor,
          intervalDays: canonical.interval_days,
          nextReview: canonical.next_review,
          lastSeen: canonical.last_seen,
          totalAttempts: canonical.total_attempts,
          correctAnswers: canonical.correct_answers,
          streak: canonical.streak,
          masteryPct: canonical.mastery_pct,
          updatedAt: new Date().toISOString(),
        }).catch(() => {})
      }
      return canonical
    }
    return null
  } catch (err) {
    if (typeof indexedDB !== 'undefined') {
      const local = await db.cachedContrastProgress.get(`${userId}:${canonicalContrastId}`).catch(() => undefined)
      if (local) {
        return canonicalizeProgressRows([{
          id: local.id ?? local.key,
          user_id: local.userId,
          contrast_id: local.contrastId,
          ease_factor: local.easeFactor,
          interval_days: local.intervalDays,
          next_review: local.nextReview,
          last_seen: local.lastSeen,
          total_attempts: local.totalAttempts,
          correct_answers: local.correctAnswers,
          streak: local.streak,
          mastery_pct: local.masteryPct,
        }])[0] ?? null
      }
    }
    throw err
  }
}

/** Upserts the contrast row after a session. */
export async function updateContrastProgress(
  userId: string,
  contrastId: string,
  sessionCorrect: number,
  sessionTotal: number,
  sr: SRResult,
  masteryPct: number,
): Promise<void> {
  const canonicalContrastId = canonicalizeContrastId(contrastId)
  const current = await getContrastProgress(userId, canonicalContrastId)

  const newTotal   = (current?.total_attempts  ?? 0) + sessionTotal
  const newCorrect = (current?.correct_answers ?? 0) + sessionCorrect
  const nowIso = new Date().toISOString()

  if (typeof indexedDB !== 'undefined') {
    void db.cachedContrastProgress.put({
      key: `${userId}:${canonicalContrastId}`,
      id: current?.id,
      userId,
      contrastId: canonicalContrastId,
      totalAttempts: newTotal,
      correctAnswers: newCorrect,
      streak: sr.streak,
      easeFactor: sr.ease_factor,
      intervalDays: sr.interval_days,
      masteryPct,
      lastSeen: nowIso,
      nextReview: sr.next_review.toISOString(),
      updatedAt: nowIso,
    }).catch(() => {})
  }

  await enqueue(
    userId,
    'user_contrast_progress',
    'upsert',
    {
      user_id:         userId,
      contrast_id:     canonicalContrastId,
      total_attempts:  newTotal,
      correct_answers: newCorrect,
      streak:          sr.streak,
      ease_factor:     sr.ease_factor,
      interval_days:   sr.interval_days,
      mastery_pct:     masteryPct,
      last_seen:       nowIso,
      next_review:     sr.next_review.toISOString(),
    },
    { user_id: userId, contrast_id: canonicalContrastId },
    'user_id,contrast_id',
  )
}

/**
 * Returns contrasts due for review today (next_review <= now or null),
 * ordered by urgency.
 */
export async function getContrastsForToday(
  userId: string
): Promise<UserContrastProgress[]> {
  const now = new Date().toISOString()
  try {
    const { data, error } = await supabase()
      .from('user_contrast_progress')
      .select('id, user_id, contrast_id, ease_factor, interval_days, next_review, last_seen, total_attempts, correct_answers, streak, mastery_pct')
      .eq('user_id', userId)
      .or(`next_review.lte.${now},next_review.is.null`)
      .order('next_review', { ascending: true })
      .limit(10)
    if (error) throw error
    return canonicalizeProgressRows(data as UserContrastProgress[])
  } catch (err) {
    if (typeof indexedDB !== 'undefined') {
      const all = await db.cachedContrastProgress.where('userId').equals(userId).toArray().catch(() => [])
      const due = all.filter(r => !r.nextReview || r.nextReview <= now)
      due.sort((a, b) => (a.nextReview ?? '').localeCompare(b.nextReview ?? ''))
      if (due.length > 0) {
        return canonicalizeProgressRows(due.slice(0, 10).map(r => ({
          id: r.id ?? r.key,
          user_id: r.userId,
          contrast_id: r.contrastId,
          ease_factor: r.easeFactor,
          interval_days: r.intervalDays,
          next_review: r.nextReview,
          last_seen: r.lastSeen,
          total_attempts: r.totalAttempts,
          correct_answers: r.correctAnswers,
          streak: r.streak,
          mastery_pct: r.masteryPct,
        })))
      }
    }
    throw err
  }
}
