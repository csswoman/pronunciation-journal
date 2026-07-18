import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { computeSM2, type SM2Progress } from '@/lib/srs/compute'
import { normalizeTopic } from '@/lib/practice/normalize-topic'
import type { JournalCorrectionResult, JournalFeedback } from './correction'

/**
 * Correcting an entry is a "recall failure" for every topic the learner tripped
 * on, so we schedule those topics at SM-2 grade 2 (a hard-but-recalled review):
 * it shortens the interval without resetting the card the way a lapse (grade < 3)
 * would. This is proper SRS scheduling, not a bare review_count bump.
 */
const JOURNAL_TOPIC_GRADE = 2

/** Topics outside the known allowlist collapse here so free text never leaks in. */
const FALLBACK_TOPIC = 'grammar:other'

export interface ApplyJournalFeedbackParams {
  userId: string
  entryId: string
  correction: JournalCorrectionResult
}

export type ApplyJournalFeedbackResult =
  | { applied: true; scheduledTopics: string[] }
  | { applied: false; reason: 'not_submitted' }

/**
 * Persist a Gemini correction on the owning `submitted` entry and schedule the
 * unique errored topics for review. Idempotent: the entry is only flipped to
 * `corrected` while it is still `submitted`, and topic scheduling runs only when
 * that transition actually happened. Replaying the same response (entry already
 * corrected) is a no-op that never double-schedules `topic_srs`.
 *
 * `newWords` are persisted as candidates inside `feedback`; they are NOT added to
 * the word bank here (opt-in lives in the UI, Plan 054).
 */
export async function applyJournalFeedback(
  supabase: SupabaseClient<Database>,
  { userId, entryId, correction }: ApplyJournalFeedbackParams,
): Promise<ApplyJournalFeedbackResult> {
  const feedback: JournalFeedback = {
    errors: correction.errors,
    newWords: correction.newWords,
  }

  // journal_entries was added after the checked-in generated database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated types predate journal_entries.
  const entries = supabase.from('journal_entries' as never) as any
  const { data: updated, error } = await entries
    .update({
      status: 'corrected',
      corrected_content: correction.correctedContent,
      feedback,
      updated_at: new Date().toISOString(),
    })
    .eq('id', entryId)
    .eq('user_id', userId)
    .eq('status', 'submitted')
    .select('id')

  if (error) throw error

  // The conditional update touched no rows: the entry was not `submitted`
  // (already corrected, or a lost race). Skip SRS to stay idempotent.
  if (!Array.isArray(updated) || updated.length === 0) {
    return { applied: false, reason: 'not_submitted' }
  }

  const topics = uniqueNormalizedTopics(correction.errors)
  await Promise.all(topics.map((topic) => scheduleTopicReview(supabase, userId, topic)))

  return { applied: true, scheduledTopics: topics }
}

function uniqueNormalizedTopics(errors: JournalCorrectionResult['errors']): string[] {
  return [...new Set(errors.map((error) => normalizeTopic(error.topic) ?? FALLBACK_TOPIC))]
}

/**
 * Apply an SM-2 grade-2 update to the user's `topic_srs` row, inserting a fresh
 * row on first review. Server-side mirror of enqueueTopicSRSUpdate (which runs
 * client-side via the Dexie outbox); here the request is already authenticated
 * and RLS-scoped, so we write straight to Supabase.
 */
async function scheduleTopicReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  topic: string,
): Promise<void> {
  const { data, error } = await supabase
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

  const next = computeSM2(current, JOURNAL_TOPIC_GRADE)
  const srsFields = {
    ease_factor: next.ease_factor,
    interval_days: next.interval_days,
    repetitions: next.repetitions,
    next_review_at: next.next_review_at,
    srs_status: next.status,
    last_reviewed_at: next.last_reviewed_at,
  }

  if (data) {
    const { error: updateError } = await supabase
      .from('topic_srs')
      .update({ ...srsFields, review_count: (data.review_count ?? 0) + 1 })
      .eq('id', data.id)
      .eq('user_id', userId)
    if (updateError) throw updateError
  } else {
    const { error: insertError } = await supabase
      .from('topic_srs')
      .insert({ user_id: userId, topic, ...srsFields, review_count: 1 })
    if (insertError) throw insertError
  }
}
