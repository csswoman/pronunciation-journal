import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { canonicalTopic } from '@/lib/topic-catalog'
import { enqueueTopicSRSUpdate } from '@/lib/practice/topic-srs-queries'
import { normalizeTopic } from '@/lib/practice/normalize-topic'
import { JOURNAL_TOPIC_IDS } from './topic-catalog'
import type { JournalCorrectionResult, JournalFeedback, ScheduledTopic } from './correction'

/**
 * Correcting an entry is a "recall failure" for every topic the learner tripped
 * on, so we schedule those topics at SM-2 grade 2 (a hard-but-recalled review):
 * it shortens the interval without resetting the card the way a lapse (grade < 3)
 * would. This is proper SRS scheduling, not a bare review_count bump.
 */
const JOURNAL_TOPIC_GRADE = 2

export interface ApplyJournalFeedbackParams {
  userId: string
  entryId: string
  correction: JournalCorrectionResult
}

export type ApplyJournalFeedbackResult =
  | { applied: true; scheduledTopics: ScheduledTopic[] }
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
  const scheduledTopics = (await Promise.all(
    topics.map((topic) => scheduleTopicReview(supabase, userId, topic)),
  )).filter((topic): topic is ScheduledTopic => topic !== null)

  return { applied: true, scheduledTopics }
}

function uniqueNormalizedTopics(errors: JournalCorrectionResult['errors']): string[] {
  const seen = new Set<string>()
  const topics: string[] = []

  for (const error of errors) {
    const raw = error.topic.trim()
    if (!raw) continue

    // Dedupe equivalent spellings before the shared writer validates and
    // persists the canonical key. Invalid values intentionally remain in the
    // list so enqueueTopicSRSUpdate can emit its warning at the one boundary.
    const key = canonicalTopic(raw) ?? normalizeTopic(raw) ?? raw.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    topics.push(raw)
  }

  return topics
}

/**
 * Apply an SM-2 grade-2 update through the same validated topic writer used by
 * browser practice. The server supplies an RPC sink so this online path does
 * not import Dexie or write `topic_srs` directly; the database RPC remains the
 * single state transition for the row.
 */
async function scheduleTopicReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  topic: string,
): Promise<ScheduledTopic | null> {
  const result = await enqueueTopicSRSUpdate(userId, topic, JOURNAL_TOPIC_GRADE, {
    allowedTopics: JOURNAL_TOPIC_IDS,
    write: async ({ rpcArgs }) => {
      const { data, error } = await supabase.rpc(
        'apply_topic_srs_rating_event',
        rpcArgs as Database['public']['Functions']['apply_topic_srs_rating_event']['Args'],
      )
      if (error) throw error
      return data
    },
  })

  if (!result) return null

  const row = result.result as Database['public']['Functions']['apply_topic_srs_rating_event']['Returns'] | null | undefined
  if (!row?.next_review_at) throw new Error('Topic review was scheduled without a date')

  return {
    topicId: result.topic,
    nextReviewAt: row.next_review_at,
    intervalDays: row.interval_days,
  }
}
