import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { enqueue } from '@/lib/sync/sync-manager'
import { computeSM2, type SM2Progress } from '@/lib/srs/compute'

/**
 * Apply an SM-2 update to the user's topic_srs row for `topic`, enqueued via
 * the outbox (retried on reconnection). Inserts a fresh row on first practice,
 * otherwise updates the existing one. `topic` MUST already be normalized
 * (see normalizeTopic). Mirrors enqueueWordBankSRSUpdate.
 */
export async function enqueueTopicSRSUpdate(
  userId: string,
  topic: string,
  grade: number,
): Promise<void> {
  const db = getSupabaseBrowserClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- topic_srs not yet in generated Supabase types
  const { data, error } = await (db as any)
    .from('topic_srs')
    .select(
      'id, ease_factor, interval_days, repetitions, next_review_at, srs_status, last_reviewed_at, review_count',
    )
    .eq('user_id', userId)
    .eq('topic', topic)
    .maybeSingle()

  if (error) throw error

  const current: SM2Progress | null = data
    ? {
        ease_factor: data.ease_factor,
        interval_days: data.interval_days,
        repetitions: data.repetitions,
        next_review_at: data.next_review_at,
        status: data.srs_status as SM2Progress['status'],
        last_reviewed_at: data.last_reviewed_at,
      }
    : null

  const next = computeSM2(current, grade)

  const srsFields = {
    ease_factor: next.ease_factor,
    interval_days: next.interval_days,
    repetitions: next.repetitions,
    next_review_at: next.next_review_at,
    srs_status: next.status,
    last_reviewed_at: next.last_reviewed_at,
  }

  if (data) {
    await enqueue(
      'topic_srs',
      'update',
      { ...srsFields, review_count: (data.review_count ?? 0) + 1 },
      { id: data.id, user_id: userId },
    )
  } else {
    await enqueue('topic_srs', 'insert', {
      user_id: userId,
      topic,
      ...srsFields,
      review_count: 1,
    })
  }
}
