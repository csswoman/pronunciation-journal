import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { computeSM2, type SM2Progress } from '@/lib/srs/compute'
import { MIN_EASE } from '@/lib/srs/schedule'
import { enqueue } from '@/lib/sync/sync-manager'
import { db, type SRSRatingEventRecord } from '@/lib/db'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { FlashcardRating } from '@/lib/word-bank/lexicon-review-types'

function supabase() {
  return getSupabaseBrowserClient()
}

export interface LexiconWordInput {
  sourceRef: string
  text: string
  definition: string
  example?: string | null
  difficulty?: number
}

export async function applyFlashcardRating(
  userId: string,
  input: LexiconWordInput,
  rating: FlashcardRating,
): Promise<WordBankEntry> {
  const db = supabase()

  const { data: existing, error: selectError } = await db
    .from('word_bank')
    .select('id, user_id, text, context, meaning, translation, ipa, example, synonyms, image_prompt, audio_url, status, difficulty, error_reason, audio_fetch_attempts, has_audio, ease_factor, interval_days, repetitions, srs_status, next_review_at, last_reviewed_at, review_count, source, source_ref, created_at, updated_at')
    .eq('user_id', userId)
    .eq('source_ref', input.sourceRef)
    .maybeSingle()

  if (selectError) throw selectError

  let entry: WordBankEntry

  if (existing) {
    entry = existing as WordBankEntry // Supabase select('*') returns untyped — shape guaranteed by the word_bank table schema
  } else {
    const { data: inserted, error: insertError } = await db
      .from('word_bank')
      .insert({
        user_id: userId,
        text: input.text,
        meaning: input.definition,
        example: input.example ?? null,
        difficulty: input.difficulty ?? 0,
        status: 'ready',
        source: 'lexicon',
        source_ref: input.sourceRef,
      })
      .select('id, user_id, text, context, meaning, translation, ipa, example, synonyms, image_prompt, audio_url, status, difficulty, error_reason, audio_fetch_attempts, has_audio, ease_factor, interval_days, repetitions, srs_status, next_review_at, last_reviewed_at, review_count, source, source_ref, created_at, updated_at')
      .single()

    if (insertError) throw insertError
    entry = inserted as WordBankEntry // Supabase select('*') returns untyped — shape guaranteed by the word_bank table schema
  }

  const now = new Date()

  let srsUpdate: {
    ease_factor: number
    interval_days: number
    repetitions: number
    srs_status: string
    next_review_at: string
    last_reviewed_at: string
    review_count: number
  }

  if (rating === 'known') {
    const next30 = new Date(now)
    next30.setDate(next30.getDate() + 30)
    srsUpdate = {
      ease_factor: entry.ease_factor ?? 2.5,
      interval_days: 30,
      repetitions: 1,
      srs_status: 'mastered',
      next_review_at: next30.toISOString(),
      last_reviewed_at: now.toISOString(),
      review_count: (entry.review_count ?? 0) + 1,
    }
  } else if (rating === 'forgot') {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    srsUpdate = {
      ease_factor: Math.max(MIN_EASE, (entry.ease_factor ?? 2.5) - 0.15),
      interval_days: 1,
      repetitions: 0,
      // Deliberately softer than a grade-1 SM-2 lapse, but still learning.
      srs_status: 'learning',
      next_review_at: tomorrow.toISOString(),
      last_reviewed_at: now.toISOString(),
      review_count: (entry.review_count ?? 0) + 1,
    }
  } else {
    const current = entry.next_review_at || entry.srs_status !== 'new'
      ? {
          ease_factor: entry.ease_factor ?? 2.5,
          interval_days: entry.interval_days ?? 1,
          repetitions: entry.repetitions ?? 0,
          next_review_at: entry.next_review_at,
          status: entry.srs_status as 'new' | 'learning' | 'review' | 'mastered', // srs_status is a constrained enum column — values are always from this set
          last_reviewed_at: entry.last_reviewed_at,
        }
      : null
    const next = computeSM2(current, 3)
    srsUpdate = {
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      srs_status: next.status,
      next_review_at: next.next_review_at!,
      last_reviewed_at: next.last_reviewed_at!,
      review_count: (entry.review_count ?? 0) + 1,
    }
  }

  const { data: updated, error: updateError } = await db
    .from('word_bank')
    .update(srsUpdate)
    .eq('id', entry.id)
    .eq('user_id', userId)
    .select('id, user_id, text, context, meaning, translation, ipa, example, synonyms, image_prompt, audio_url, status, difficulty, error_reason, audio_fetch_attempts, has_audio, ease_factor, interval_days, repetitions, srs_status, next_review_at, last_reviewed_at, review_count, source, source_ref, created_at, updated_at')
    .single()

  if (updateError) throw updateError
  return updated as WordBankEntry // Supabase select('*') returns untyped — shape guaranteed by the word_bank table schema
}

export async function applyPhase2Penalty(
  userId: string,
  wordBankId: string,
  currentEaseFactor: number,
): Promise<void> {
  const db = supabase()
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { error } = await db
    .from('word_bank')
    .update({
      srs_status: 'learning',
      interval_days: 1,
      repetitions: 0,
      ease_factor: Math.max(MIN_EASE, currentEaseFactor - 0.15),
      next_review_at: tomorrow.toISOString(),
      last_reviewed_at: now.toISOString(),
    })
    .eq('id', wordBankId)
    .eq('user_id', userId)

  if (error) throw error
}

/**
 * Read the current SRS state of a word_bank entry, apply SM-2 with the given
 * grade, and persist the result. Returns the new SM2Progress.
 *
 * Used by lib/practice/queries.ts for general practice-engine reviews.
 * Throws on Supabase errors so callers can decide whether to surface or swallow.
 */
export async function reviewWordBankEntry(
  userId: string,
  wordId: string,
  grade: number,
): Promise<SM2Progress> {
  const db = supabase()

  const { data, error: fetchError } = await db
    .from('word_bank')
    .select(
      'ease_factor, interval_days, repetitions, next_review_at, srs_status, last_reviewed_at, review_count',
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
        status: data.srs_status as SM2Progress['status'], // srs_status is a constrained enum column — values are always from this set
        last_reviewed_at: data.last_reviewed_at,
      }
    : null

  const next = computeSM2(current, grade)

  const { error: updateError } = await db
    .from('word_bank')
    .update({
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      next_review_at: next.next_review_at,
      srs_status: next.status,
      last_reviewed_at: next.last_reviewed_at,
      review_count: (data.review_count ?? 0) + 1,
    })
    .eq('id', wordId)
    .eq('user_id', userId)

  if (updateError) throw updateError

  return next
}

/**
 * Build the local rating-event row + outbox RPC-call args for a word_bank
 * rating. Pure/local-only — no network read, no Dexie write. Callers write
 * the returned event to `db.srsRatingEvents` and enqueue the returned outbox
 * args inside the SAME Dexie transaction as the rest of the answer write
 * (see lib/practice/queries.ts::savePracticeAnswer), so the event and its
 * outbox entry are committed atomically or not at all.
 *
 * Design (plan 061 step 3): the client no longer reads word_bank's current
 * SM-2 state before writing. It submits an IMMUTABLE rating event (grade +
 * word id + idempotency key) and enqueues a call to the transactional
 * `apply_word_bank_rating_event` RPC (see supabase/migrations/20260720080000),
 * which computes SM-2 server-side under a row lock. This removes the
 * lost-update race characterized in srs-queries.race.test.ts: there is no
 * more local "current state" read to race on, and duplicate RPC calls
 * (outbox retries) are no-ops by idempotency key.
 */
export function buildWordBankRatingEvent(
  userId: string,
  wordId: string,
  grade: number,
  occurredAt: string = new Date().toISOString(),
): { event: SRSRatingEventRecord; rpcArgs: Record<string, unknown> } {
  const idempotencyKey = crypto.randomUUID()
  const event: SRSRatingEventRecord = {
    id: idempotencyKey,
    userId,
    entityType: 'word_bank',
    entityId: wordId,
    grade,
    occurredAt,
    status: 'pending',
    createdAt: occurredAt,
  }
  const rpcArgs = {
    p_idempotency_key: idempotencyKey,
    p_user_id: userId,
    p_word_id: wordId,
    p_grade: grade,
    p_occurred_at: occurredAt,
  }
  return { event, rpcArgs }
}

/**
 * Local-only: write the rating event to Dexie and enqueue the RPC call to
 * the outbox, in one Dexie transaction. No network read — see
 * buildWordBankRatingEvent's design note. Call this INSIDE a Dexie
 * transaction alongside other related writes (answer_history, topic rating)
 * for atomicity; it does not open its own transaction.
 */
export async function enqueueWordBankSRSUpdate(
  userId: string,
  wordId: string,
  grade: number,
): Promise<void> {
  const { event, rpcArgs } = buildWordBankRatingEvent(userId, wordId, grade)
  await db.srsRatingEvents.add(event)
  await enqueue(userId, 'word_bank', 'rpc', rpcArgs, undefined, undefined, 'apply_word_bank_rating_event')
}
