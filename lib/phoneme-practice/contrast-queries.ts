import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { db, type CachedContrastProgressRecord } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import { canonicalizeContrastId } from './phoneme-similarity'
import { canonicalizeProgressRows } from '@/lib/sounds/normalization'
import { priorMasterySessionCount } from './mastery-pct'
import {
  fromCachedProgressRecord,
  hasPendingContrastEvent,
  preferPendingContrastProgress,
  toCachedProgressRecord,
} from './contrast-cache'
import type { UserContrastProgress, SRResult } from './types'

export function supabase() {
  return getSupabaseBrowserClient()
}

const PROGRESS_SELECT = 'id, user_id, contrast_id, ease_factor, interval_days, next_review, last_seen, total_attempts, correct_answers, streak, mastery_pct, raw_mastery, raw_mastery_updated_at, mastery_session_count, adaptive_score, observation_count'

function latestTimestamp(previous: string | null | undefined, next: string): string {
  const previousTime = previous ? Date.parse(previous) : Number.NaN
  const nextTime = Date.parse(next)
  if (!Number.isFinite(nextTime)) return previous ?? next
  if (!Number.isFinite(previousTime) || nextTime >= previousTime) return next
  return previous!
}

async function hasPersistedContrastEvent(
  userId: string,
  contrastId: string,
  attemptId: string | undefined,
): Promise<boolean> {
  if (!attemptId) return false
  try {
    const { data, error } = await supabase()
      .from('contrast_session_events')
      .select('id')
      .eq('user_id', userId)
      .eq('attempt_id', attemptId)
      .eq('contrast_id', contrastId)
      .maybeSingle()
    return !error && Boolean(data)
  } catch {
    // The event table may not be available during a rolling migration or
    // while offline. The idempotent RPC remains the final authority.
    return false
  }
}

export async function getAllContrastProgress(
  userId: string
): Promise<UserContrastProgress[]> {
  try {
    const { data, error } = await supabase()
      .from('user_contrast_progress')
      .select(PROGRESS_SELECT)
      .eq('user_id', userId)
    if (error) throw error
    const canonical = await preferPendingContrastProgress(
      userId,
      canonicalizeProgressRows(data as unknown as UserContrastProgress[]),
    )
    if (typeof indexedDB !== 'undefined') {
      await db.cachedContrastProgress.bulkPut(canonical.map((r) => toCachedProgressRecord(userId, r))).catch(() => {})
    }
    return canonical
  } catch (err) {
    if (typeof indexedDB !== 'undefined') {
      const local = await db.cachedContrastProgress.where('userId').equals(userId).toArray().catch(() => [])
      if (local.length > 0) {
        return canonicalizeProgressRows(local.map(fromCachedProgressRecord))
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
  if (typeof indexedDB !== 'undefined') {
    const local = await db.cachedContrastProgress.get(`${userId}:${canonicalContrastId}`).catch(() => undefined)
    if (local && await hasPendingContrastEvent(userId, canonicalContrastId)) {
      return canonicalizeProgressRows([fromCachedProgressRecord(local)])[0] ?? null
    }
  }
  try {
    const { data, error } = await supabase()
      .from('user_contrast_progress')
      .select(PROGRESS_SELECT)
      .eq('user_id', userId)
      .eq('contrast_id', canonicalContrastId)
      .maybeSingle()
    if (error) throw error
    if (data) {
      const canonical = canonicalizeProgressRows([data as unknown as UserContrastProgress])[0] ?? null
      if (canonical && typeof indexedDB !== 'undefined') {
        await db.cachedContrastProgress.put(toCachedProgressRecord(userId, canonical)).catch(() => {})
      }
      return canonical
    }
    return null
  } catch (err) {
    if (typeof indexedDB !== 'undefined') {
      const local = await db.cachedContrastProgress.get(`${userId}:${canonicalContrastId}`).catch(() => undefined)
      if (local) {
        return canonicalizeProgressRows([fromCachedProgressRecord(local)])[0] ?? null
      }
    }
    throw err
  }
}

/** Updates the contrast row after a session, supporting incremental deltas and raw EMA persistence. */
export async function updateContrastProgress(
  userId: string,
  contrastId: string,
  sessionCorrect: number,
  sessionTotal: number,
  sr: SRResult,
  masteryPct: number,
  rawMastery?: number | null,
  attemptId?: string,
  occurredAt?: string,
  sessionAccuracy?: number,
): Promise<void> {
  const canonicalContrastId = canonicalizeContrastId(contrastId)
  let remoteCurrent: UserContrastProgress | null = null
  try {
    remoteCurrent = await getContrastProgress(userId, canonicalContrastId)
  } catch (error) {
    if (typeof indexedDB === 'undefined') throw error
    // A new contrast can be completed while offline with no cache row yet;
    // the atomic local projection + RPC outbox write will establish its base.
  }
  if (await hasPersistedContrastEvent(userId, canonicalContrastId, attemptId)) return
  const nowIso = occurredAt ?? new Date().toISOString()
  const effectiveAttemptId = attemptId ?? crypto.randomUUID()
  const resolvedRawMastery = rawMastery ?? remoteCurrent?.raw_mastery ?? null
  const rpcPayload = {
    p_contrast_id: canonicalContrastId,
    p_session_correct: sessionCorrect,
    p_session_total: sessionTotal,
    // These legacy fields remain in the function signature for rolling
    // compatibility; the server now derives SRS and mastery from the event.
    p_streak: sr.streak,
    p_ease_factor: sr.ease_factor,
    p_interval_days: sr.interval_days,
    p_next_review: sr.next_review.toISOString(),
    p_mastery_pct: masteryPct,
    p_raw_mastery: resolvedRawMastery,
    p_attempt_id: effectiveAttemptId,
    p_session_accuracy: sessionAccuracy ?? (sessionTotal > 0 ? (sessionCorrect / sessionTotal) * 100 : 0),
    p_occurred_at: nowIso,
    p_session_passed: sessionTotal > 0 && sessionCorrect >= Math.ceil(sessionTotal / 2),
  }

  if (typeof indexedDB !== 'undefined') {
    await db.transaction('rw', [db.cachedContrastProgress, db.syncOutbox], async () => {
      // Read inside the same transaction as the write. Two tabs can finish
      // offline sessions at once; using a snapshot read here would lose one
      // local delta even though both RPC events were queued successfully.
      const cached = await db.cachedContrastProgress.get(`${userId}:${canonicalContrastId}`)
      const duplicate = await db.syncOutbox
        .where('userId')
        .equals(userId)
        .filter((entry) => (
          entry.rpcName === 'apply_contrast_session_result'
          && entry.payload.p_contrast_id === canonicalContrastId
          && entry.payload.p_attempt_id === effectiveAttemptId
        ))
        .first()
      if (duplicate) return
      const current = cached ? fromCachedProgressRecord(cached) : remoteCurrent
      const newTotal = (current?.total_attempts ?? 0) + sessionTotal
      const newCorrect = (current?.correct_answers ?? 0) + sessionCorrect
      const resolvedRawMastery = rawMastery ?? current?.raw_mastery ?? null
      const masterySessionCount = priorMasterySessionCount(current ?? {
        total_attempts: 0,
        mastery_session_count: 0,
      }) + 1
      const rawMasteryUpdatedAt = latestTimestamp(
        current?.raw_mastery_updated_at ?? current?.last_seen,
        nowIso,
      )
      const lastSeen = latestTimestamp(current?.last_seen, nowIso)
      const localRecord: CachedContrastProgressRecord = {
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
        rawMastery: resolvedRawMastery,
        rawMasteryUpdatedAt,
        masterySessionCount,
        adaptiveScore: current?.adaptive_score,
        observationCount: current?.observation_count,
        lastSeen,
        nextReview: sr.next_review.toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await db.cachedContrastProgress.put(localRecord)
      await enqueue(
        userId,
        'user_contrast_progress',
        'rpc',
        rpcPayload,
        undefined,
        undefined,
        'apply_contrast_session_result',
        effectiveAttemptId,
      )
    })
    return
  }

  await enqueue(
    userId,
    'user_contrast_progress',
    'rpc',
    rpcPayload,
    undefined,
    undefined,
    'apply_contrast_session_result',
    effectiveAttemptId,
  )
}

export { getContrastsForToday } from './contrast-schedule'
