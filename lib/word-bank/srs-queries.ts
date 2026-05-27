import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { computeSM2, type SM2Progress } from '@/lib/srs/compute'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { FlashcardRating } from '@/lib/word-bank/lexicon-review-types'

const MIN_EASE = 1.3

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
    .select('*')
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
      .select('*')
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
      ease_factor: 2.5,
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
      srs_status: 'new',
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
    .select('*')
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
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { error } = await db
    .from('word_bank')
    .update({
      srs_status: 'new',
      interval_days: 0,
      ease_factor: Math.max(MIN_EASE, currentEaseFactor - 0.15),
      next_review_at: tomorrow.toISOString(),
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
      review_count: data.repetitions + 1,
    })
    .eq('id', wordId)
    .eq('user_id', userId)

  if (updateError) throw updateError

  return next
}
