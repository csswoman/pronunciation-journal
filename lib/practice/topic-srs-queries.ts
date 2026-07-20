import { db, type SRSRatingEventRecord } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'

/**
 * Build the local rating-event row + outbox RPC-call args for a topic_srs
 * rating. Pure/local-only — no network read, no Dexie write. Callers write
 * the returned event to `db.srsRatingEvents` and enqueue the returned outbox
 * args inside the SAME Dexie transaction as the rest of the answer write
 * (see lib/practice/queries.ts::savePracticeAnswer).
 *
 * Design (plan 061 step 3): mirrors buildWordBankRatingEvent — the client no
 * longer reads topic_srs's current state (or even whether a row exists yet)
 * before writing. It submits an immutable rating event keyed by
 * (user_id, topic) — topic_srs's natural key, since a brand-new topic has no
 * row/id yet — and enqueues a call to `apply_topic_srs_rating_event`, which
 * creates the row on first rating and applies SM-2 server-side under a row
 * lock. This removes both races characterized in
 * topic-srs-queries.race.test.ts: the double-insert race for a brand-new
 * topic (the RPC's ON CONFLICT-as-lock serializes concurrent first ratings)
 * and the lost-update race for an existing topic.
 *
 * `topic` MUST already be normalized (see normalizeTopic).
 */
export function buildTopicSrsRatingEvent(
  userId: string,
  topic: string,
  grade: number,
  occurredAt: string = new Date().toISOString(),
): { event: SRSRatingEventRecord; rpcArgs: Record<string, unknown> } {
  const idempotencyKey = crypto.randomUUID()
  const event: SRSRatingEventRecord = {
    id: idempotencyKey,
    userId,
    entityType: 'topic_srs',
    topic,
    grade,
    occurredAt,
    status: 'pending',
    createdAt: occurredAt,
  }
  const rpcArgs = {
    p_idempotency_key: idempotencyKey,
    p_user_id: userId,
    p_topic: topic,
    p_grade: grade,
    p_occurred_at: occurredAt,
  }
  return { event, rpcArgs }
}

/**
 * Local-only: write the rating event to Dexie and enqueue the RPC call to
 * the outbox, in one Dexie transaction. No network read — see
 * buildTopicSrsRatingEvent's design note. Call this INSIDE a Dexie
 * transaction alongside other related writes for atomicity; it does not
 * open its own transaction.
 */
export async function enqueueTopicSRSUpdate(
  userId: string,
  topic: string,
  grade: number,
): Promise<void> {
  const { event, rpcArgs } = buildTopicSrsRatingEvent(userId, topic, grade)
  await db.srsRatingEvents.add(event)
  await enqueue(userId, 'topic_srs', 'rpc', rpcArgs, undefined, undefined, 'apply_topic_srs_rating_event')
}
