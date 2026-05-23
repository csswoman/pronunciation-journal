import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'
import { answerToGrade } from './grade'
import { reviewWordBankEntry } from '@/lib/word-bank/srs-queries'
import type {
  PracticeAnswer,
  PracticeContext,
  SessionResult,
} from './types'

function supabase() {
  return getSupabaseBrowserClient()
}

/**
 * Persist a single PracticeAnswer to `answer_history`.
 *
 * Coexists with `saveAnswers()` in lib/phoneme-practice/queries.ts —
 * that function continues to serve the current Sound Lab flow. This one
 * is the entry point for the unified Practice Engine and also writes the
 * new `context` and `content_id` columns added in
 * supabase/migrations/20260519120000_practice_engine.sql.
 */
export async function savePracticeAnswer(
  userId: string,
  answer: PracticeAnswer,
): Promise<void> {
  // Phoneme exercises forward their targetWord via exercisePayload.targetWord
  // when the adapter constructs the PhonemePayload. Pull it out for the
  // dedicated column when present.
  const payload = answer.exercisePayload as
    | { targetWord?: string }
    | null
    | undefined
  const targetWord = payload?.targetWord ?? null

  // Prefer a prefixed content_id when sourceRef is present so SRS queries can
  // filter by source without joining. Format: "<source>:<id>" (e.g. "word_bank:abc-123").
  const contentId = answer.sourceRef
    ? `${answer.sourceRef.source}:${answer.sourceRef.id}`
    : answer.contentId

  const row = {
    user_id: userId,
    sound_id: answer.soundId ?? null,
    exercise_type_id: answer.exerciseTypeId,
    is_correct: answer.isCorrect,
    user_answer: answer.userAnswer ?? null,
    target_word: targetWord,
    time_ms: answer.timeMs,
    exercise_payload: (answer.exercisePayload ?? null) as Json | null,
    context: answer.context,
    content_id: contentId,
  }

  const grade = answerToGrade(answer)
  const rowWithGrade = { ...row, grade }

  const { error } = await supabase().from('answer_history').insert(rowWithGrade)
  if (error) throw error

  // Fire-and-forget SRS update for word_bank entries. Never blocks the caller.
  if (answer.sourceRef?.source === 'word_bank') {
    const wordId = answer.sourceRef.id
    reviewWordBankEntry(userId, wordId, grade).catch((err) => {
      console.error('[practice/queries] reviewWordBankEntry failed', { wordId, grade, err })
    })
  }
}

/**
 * Persist every result in a SessionResult in parallel. Best-effort:
 * individual failures are logged but do not propagate, so a transient
 * insert error never breaks the user's session UX.
 */
export async function savePracticeSession(
  userId: string,
  results: SessionResult,
  context: PracticeContext,
): Promise<void> {
  await Promise.all(
    results.results.map(async (r) => {
      try {
        await savePracticeAnswer(userId, { ...r, context })
      } catch (err) {
        console.error('[practice/queries] savePracticeAnswer failed', {
          exerciseId: r.exerciseId,
          slug: r.slug,
          err,
        })
      }
    }),
  )
}
