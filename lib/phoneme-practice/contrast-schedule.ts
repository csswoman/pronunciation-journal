import { db } from '@/lib/db'
import { canonicalizeProgressRows } from '@/lib/sounds/normalization'
import {
  fromCachedProgressRecord,
  preferPendingContrastProgress,
} from './contrast-cache'
import { supabase } from './contrast-queries'
import type { UserContrastProgress } from './types'

const PROGRESS_SELECT = 'id, user_id, contrast_id, ease_factor, interval_days, next_review, last_seen, total_attempts, correct_answers, streak, mastery_pct, raw_mastery, raw_mastery_updated_at, mastery_session_count, adaptive_score, observation_count'

/** Returns contrasts due for review, preserving queued local projections. */
export async function getContrastsForToday(userId: string): Promise<UserContrastProgress[]> {
  const now = new Date().toISOString()
  try {
    const { data, error } = await supabase()
      .from('user_contrast_progress')
      .select(PROGRESS_SELECT)
      .eq('user_id', userId)
      .or(`next_review.lte.${now},next_review.is.null`)
      .order('next_review', { ascending: true })
      .limit(10)
    if (error) throw error
    const merged = canonicalizeProgressRows(await preferPendingContrastProgress(
      userId,
      canonicalizeProgressRows(data as unknown as UserContrastProgress[]),
    ))
    return merged
      .filter((row) => !row.next_review || row.next_review <= now)
      .sort((a, b) => (a.next_review ?? '').localeCompare(b.next_review ?? ''))
      .slice(0, 10)
  } catch (err) {
    if (typeof indexedDB !== 'undefined') {
      const all = await db.cachedContrastProgress.where('userId').equals(userId).toArray().catch(() => [])
      const due = all.filter((r) => !r.nextReview || r.nextReview <= now)
      due.sort((a, b) => (a.nextReview ?? '').localeCompare(b.nextReview ?? ''))
      if (due.length > 0) {
        return canonicalizeProgressRows(due.slice(0, 10).map(fromCachedProgressRecord))
      }
    }
    throw err
  }
}
