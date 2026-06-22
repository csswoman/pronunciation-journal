import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'
import { answerToGrade } from './grade'
import { enqueueWordBankSRSUpdate } from '@/lib/word-bank/srs-queries'
import { normalizeTopic } from '@/lib/practice/normalize-topic'
import { enqueueTopicSRSUpdate } from '@/lib/practice/topic-srs-queries'
import { upsertFragmentSrs } from '@/lib/practice/fragment-srs'
import {
  isLessonComplete,
  markLessonComplete,
  markLessonIncomplete,
} from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import { buildSessionResult } from '@/lib/practice/session-result'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import type {
  PracticeAnswer,
  PracticeContext,
  SessionResult,
} from './types'

function supabase() {
  return getSupabaseBrowserClient()
}

/**
 * Marks a course/mini-lesson as complete in Dexie AND records a row in
 * answer_history (context='courses') so lesson completions appear in streak
 * and consistency charts. Best-effort: Supabase failure never blocks the
 * local Dexie write.
 */
export async function recordLessonComplete(courseSlug: string, lessonSlug: string): Promise<void> {
  if (await isLessonComplete(courseSlug, lessonSlug)) return

  const { data: { user } } = await supabase().auth.getUser()
  if (user) {
    const lessonId = `${courseSlug}:${lessonSlug}`
    const answer = {
      exerciseId: lessonId,
      exerciseTypeId: 5, // fill_blank — closest to "reading/completing a lesson"
      slug: 'fill_blank',
      isCorrect: true,
      contentId: lessonId,
      context: 'courses',
      timeMs: 0,
    } as const
    await savePracticeAnswer(user.id, answer)
    await recordActivitySession(user.id, {
      practiceContext: 'courses',
      sessionResult: buildSessionResult([{ ...answer, completedAt: new Date() }]),
      metadata: { lessonSlug },
    })
  }

  await markLessonComplete(courseSlug, lessonSlug)
}

/** Reverses local completion and removes its remote progress event(s). */
export async function recordLessonIncomplete(
  courseSlug: string,
  lessonSlug: string,
): Promise<void> {
  const { data: { user } } = await supabase().auth.getUser()
  if (user) {
    await enqueue(
      'answer_history',
      'delete',
      {},
      {
        user_id: user.id,
        context: 'courses',
        content_id: `${courseSlug}:${lessonSlug}`,
      },
    )
  }

  await markLessonIncomplete(courseSlug, lessonSlug)
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
  // Exercises with no exerciseTypeId (e.g. reader exposure) are not tracked in answer_history.
  if (answer.exerciseTypeId === null) return

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

  const normalizedTopic = answer.topic ? normalizeTopic(answer.topic) : null

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
    topic: normalizedTopic,
  }

  const grade = answerToGrade(answer)
  const rowWithGrade = { ...row, grade }

  await enqueue('answer_history', 'insert', rowWithGrade as Record<string, unknown>)

  // Enqueue SRS update for word_bank entries via the sync outbox (retried on reconnection).
  if (answer.sourceRef?.source === 'word_bank') {
    const wordId = answer.sourceRef.id
    await enqueueWordBankSRSUpdate(userId, wordId, grade)
  } else if (answer.sourceRef?.source === 'text_fragments') {
    // System sentences carry no per-user Supabase row; their review state is
    // local (Dexie srsData), so this write is direct rather than via the outbox.
    await upsertFragmentSrs(answer.sourceRef.id, grade)
  }

  // Enqueue SRS update for the concept (topic) when the exercise carries one.
  if (normalizedTopic) {
    await enqueueTopicSRSUpdate(userId, normalizedTopic, grade)
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
