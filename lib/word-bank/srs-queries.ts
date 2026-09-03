import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
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

const WB_COLUMNS = 'id, user_id, text, context, meaning, translation, ipa, example, synonyms, image_prompt, audio_url, status, difficulty, error_reason, audio_fetch_attempts, has_audio, ease_factor, interval_days, repetitions, srs_status, next_review_at, last_reviewed_at, review_count, familiarity_status, familiarity_confidence, verification_due_at, mastery_provenance, mastery_version, objective_evidence_count, source, source_ref, created_at, updated_at'

function calculateFlashcardUpdate(rating: FlashcardRating, entry?: WordBankEntry, now: Date = new Date()): Database['public']['Tables']['word_bank']['Update'] {
  const verificationDue = new Date(now)
  if (rating === 'known') {
    verificationDue.setDate(verificationDue.getDate() + 1)
    return { familiarity_status: 'familiar', familiarity_confidence: 100, verification_due_at: verificationDue.toISOString() }
  }
  if (rating === 'forgot') {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return {
      ease_factor: entry ? Math.max(MIN_EASE, (entry.ease_factor ?? 2.5) - 0.15) : 2.35,
      interval_days: 1,
      repetitions: 0,
      srs_status: 'learning',
      next_review_at: tomorrow.toISOString(),
      last_reviewed_at: now.toISOString(),
      review_count: (entry?.review_count ?? 0) + 1,
      familiarity_status: 'unknown',
      familiarity_confidence: 0,
      verification_due_at: tomorrow.toISOString(),
    }
  }
  verificationDue.setDate(verificationDue.getDate() + 2)
  return { familiarity_status: 'familiar', familiarity_confidence: 60, verification_due_at: verificationDue.toISOString() }
}

export async function applyFlashcardRating(
  userId: string,
  input: LexiconWordInput,
  rating: FlashcardRating,
): Promise<WordBankEntry> {
  const client = supabase()
  const now = new Date()

  try {
    const { data: existing, error: selectError } = await client
      .from('word_bank')
      .select(WB_COLUMNS)
      .eq('user_id', userId)
      .eq('source_ref', input.sourceRef)
      .maybeSingle()

    if (selectError) throw selectError

    let entry: WordBankEntry
    if (existing) {
      entry = existing as WordBankEntry
    } else {
      const { data: inserted, error: insertError } = await client
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
        .select(WB_COLUMNS)
        .single()

      if (insertError) throw insertError
      entry = inserted as WordBankEntry
    }

    const srsUpdate = calculateFlashcardUpdate(rating, entry, now)
    const { data: updated, error: updateError } = await client
      .from('word_bank')
      .update(srsUpdate)
      .eq('id', entry.id)
      .eq('user_id', userId)
      .select(WB_COLUMNS)
      .single()

    if (updateError) throw updateError
    return updated as WordBankEntry
  } catch (err) {
    console.warn('[applyFlashcardRating] Supabase call failed, queuing offline outbox event', err)
    const grade = rating === 'known' ? 5 : rating === 'normal' ? 3 : 1
    const wordId = input.sourceRef
    try {
      await enqueueWordBankSRSUpdate(userId, wordId, grade, { rating, sourceRef: input.sourceRef, offline: true })
    } catch (enqueueErr) {
      console.warn('[applyFlashcardRating] outbox enqueue fallback failed', enqueueErr)
    }

    const srsUpdate = calculateFlashcardUpdate(rating, undefined, now)
    return {
      id: wordId,
      user_id: userId,
      text: input.text,
      meaning: input.definition,
      example: input.example ?? null,
      difficulty: input.difficulty ?? 0,
      status: 'ready',
      source: 'lexicon',
      source_ref: input.sourceRef,
      ease_factor: 2.5,
      interval_days: 1,
      repetitions: 1,
      srs_status: 'learning',
      next_review_at: new Date(Date.now() + 86400000).toISOString(),
      last_reviewed_at: now.toISOString(),
      review_count: 1,
      familiarity_status: rating === 'forgot' ? 'unknown' : 'familiar',
      familiarity_confidence: rating === 'known' ? 100 : rating === 'normal' ? 60 : 0,
      verification_due_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      ...srsUpdate,
    } as WordBankEntry
  }
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
      familiarity_status: 'unknown',
      familiarity_confidence: 0,
      verification_due_at: tomorrow.toISOString(),
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
  evaluatorMetadata?: Record<string, unknown>,
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
    ...(evaluatorMetadata ? { evaluatorMetadata } : {}),
  }
  const rpcArgs = {
    p_idempotency_key: idempotencyKey,
    p_user_id: userId,
    p_word_id: wordId,
    p_grade: grade,
    p_occurred_at: occurredAt,
    p_evaluator_metadata: evaluatorMetadata ?? {},
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
  evaluatorMetadata?: Record<string, unknown>,
): Promise<void> {
  const { event, rpcArgs } = buildWordBankRatingEvent(userId, wordId, grade, new Date().toISOString(), evaluatorMetadata)
  await db.srsRatingEvents.add(event)
  await enqueue(userId, 'word_bank', 'rpc', rpcArgs, undefined, undefined, 'apply_word_bank_rating_event')
}
