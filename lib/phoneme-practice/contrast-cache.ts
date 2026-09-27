import { db, type CachedContrastProgressRecord } from '@/lib/db'
import { canonicalizeProgressRows } from '@/lib/sounds/normalization'
import type { UserContrastProgress } from './types'

export function toCachedProgressRecord(userId: string, r: UserContrastProgress): CachedContrastProgressRecord {
  return {
    key: `${userId}:${r.contrast_id}`,
    id: r.id,
    userId,
    contrastId: r.contrast_id,
    easeFactor: r.ease_factor,
    intervalDays: r.interval_days,
    nextReview: r.next_review,
    lastSeen: r.last_seen,
    totalAttempts: r.total_attempts,
    correctAnswers: r.correct_answers,
    streak: r.streak,
    masteryPct: r.mastery_pct,
    rawMastery: r.raw_mastery ?? null,
    rawMasteryUpdatedAt: r.raw_mastery_updated_at ?? null,
    masterySessionCount: r.mastery_session_count ?? 0,
    adaptiveScore: r.adaptive_score,
    observationCount: r.observation_count,
    updatedAt: new Date().toISOString(),
  }
}

export function fromCachedProgressRecord(r: CachedContrastProgressRecord): UserContrastProgress {
  return {
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
    raw_mastery: r.rawMastery ?? null,
    raw_mastery_updated_at: r.rawMasteryUpdatedAt ?? null,
    mastery_session_count: r.masterySessionCount ?? 0,
    adaptive_score: r.adaptiveScore,
    observation_count: r.observationCount,
  }
}

export async function hasPendingContrastEvent(userId: string, contrastId: string): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return false
  try {
    const entries = await db.syncOutbox.where('userId').equals(userId).toArray()
    return entries.some((entry) => {
      if (entry.rpcName !== 'apply_contrast_session_result') return false
      const payload = entry.payload as Record<string, unknown>
      return payload.p_contrast_id === contrastId
    })
  } catch {
    return false
  }
}

/** Keep local projections ahead of a remote snapshot while their RPC is queued. */
export async function preferPendingContrastProgress(
  userId: string,
  remote: UserContrastProgress[],
): Promise<UserContrastProgress[]> {
  if (typeof indexedDB === 'undefined') return remote
  try {
    const [entries, local] = await Promise.all([
      db.syncOutbox.where('userId').equals(userId).toArray(),
      db.cachedContrastProgress.where('userId').equals(userId).toArray(),
    ])
    const pendingIds = new Set(
      entries
        .filter((entry) => entry.rpcName === 'apply_contrast_session_result')
        .map((entry) => String((entry.payload as Record<string, unknown>).p_contrast_id ?? ''))
        .filter(Boolean),
    )
    if (pendingIds.size === 0) return remote
    const localByContrast = new Map(
      canonicalizeProgressRows(local.map(fromCachedProgressRecord))
        .map((record) => [record.contrast_id, record]),
    )
    const remoteIds = new Set(remote.map((row) => row.contrast_id))
    const merged = remote.map((row) => (
      pendingIds.has(row.contrast_id) ? localByContrast.get(row.contrast_id) ?? row : row
    ))
    for (const contrastId of pendingIds) {
      const pending = localByContrast.get(contrastId)
      if (pending && !remoteIds.has(contrastId)) merged.push(pending)
    }
    return merged
  } catch {
    return remote
  }
}
