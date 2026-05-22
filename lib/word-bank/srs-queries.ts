import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { computeSM2, type SM2Progress } from '@/lib/srs/compute'

function supabase() {
  return getSupabaseBrowserClient()
}

/**
 * Read the current SRS state of a word_bank entry, apply SM-2 with the given
 * grade, and persist the result. Returns the new SM2Progress.
 *
 * Throws on Supabase errors so callers can decide whether to surface or swallow.
 */
export async function reviewWordBankEntry(
  userId: string,
  wordId: string,
  grade: number,
): Promise<SM2Progress> {
  const { data, error: fetchError } = await supabase()
    .from('word_bank')
    .select(
      'ease_factor, interval_days, repetitions, next_review_at, srs_status, last_reviewed_at',
    )
    .eq('id', wordId)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError

  const current: SM2Progress | null = data.next_review_at || data.srs_status !== 'new'
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

  const { error: updateError } = await supabase()
    .from('word_bank')
    .update({
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      next_review_at: next.next_review_at,
      srs_status: next.status,
      last_reviewed_at: next.last_reviewed_at,
      review_count: data.repetitions + 1,
    })
    .eq('id', wordId)
    .eq('user_id', userId)

  if (updateError) throw updateError

  return next
}
