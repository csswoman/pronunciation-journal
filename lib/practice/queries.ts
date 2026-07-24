import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Json } from '@/lib/supabase/types'
import { answerToGrade } from './grade'
import { enqueueWordBankSRSUpdate } from '@/lib/word-bank/srs-queries'
import { normalizeTopic } from '@/lib/practice/normalize-topic'
import { enqueueTopicSRSUpdate } from '@/lib/practice/topic-srs-queries'
import { upsertFragmentSrs } from '@/lib/practice/fragment-srs'
import {
  ATTRIBUTION_VERSION,
  mergeAttributionIntoPayload,
} from '@/lib/practice/attribution'
import { isUuid } from '@/lib/review/content-ref'
import {
  db,
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
  ExerciseResult,
  SessionResult,
} from './types'

function supabase() {
  return getSupabaseBrowserClient()
}

export const LESSON_QUIZ_PASS_THRESHOLD = 0.7

export function isLessonQuizPassed(correct: number, total: number): boolean {
  return total > 0 && correct / total >= LESSON_QUIZ_PASS_THRESHOLD
}

/** Marks course/mini-lesson content complete without inventing quiz evidence. */
export async function recordLessonComplete(courseSlug: string, lessonSlug: string): Promise<void> {
  const { data: { user } } = await supabase().auth.getUser()
  if (!user) throw new Error('Cannot record lesson completion without an authenticated user')
  if (await isLessonComplete(user.id, courseSlug, lessonSlug)) return

  const completedAt = new Date().toISOString()
  await db.transaction('rw', [db.completedLessons, db.syncOutbox], async () => {
    await markLessonComplete(user.id, courseSlug, lessonSlug)
    await enqueue(
      user.id,
      'lesson_completions',
      'upsert',
      {
        user_id: user.id,
        course_slug: courseSlug,
        lesson_slug: lessonSlug,
        completed_at: completedAt,
        source: 'lesson_completion',
        updated_at: completedAt,
      },
      undefined,
      'user_id,course_slug,lesson_slug',
    )
  })
}

/** Reverses only the completion marker; genuine quiz answers/sessions remain evidence. */
export async function recordLessonIncomplete(
  courseSlug: string,
  lessonSlug: string,
): Promise<void> {
  const { data: { user } } = await supabase().auth.getUser()
  if (!user) throw new Error('Cannot remove lesson completion without an authenticated user')

  await db.transaction('rw', [db.completedLessons, db.syncOutbox], async () => {
    await markLessonIncomplete(user.id, courseSlug, lessonSlug)
    await enqueue(user.id, 'lesson_completions', 'delete', {}, {
      user_id: user.id,
      course_slug: courseSlug,
      lesson_slug: lessonSlug,
    })
  })
}

/**
 * Persist a single PracticeAnswer to `answer_history`, plus any word/topic/
 * fragment SRS rating it implies — all in ONE Dexie transaction so a crash
 * between writes can never leave the answer recorded with its rating(s)
 * lost, or vice versa (plan 061 step 3). Mirrors the transactional pattern
 * used by `recordLessonComplete` above and `saveTrackedItem` in
 * lib/tracking/queries.ts.
 *
 * Coexists with `saveAnswers()` in lib/phoneme-practice/queries.ts —
 * that function continues to serve the current Sound Lab flow. This one
 * is the entry point for the unified Practice Engine and also writes the
 * new `context` and `content_id` columns added in
 * supabase/migrations/20260519120000_practice_engine.sql.
 *
 * "No valid target identity" (plan text): a topic-less exercise is normal,
 * not an error — `normalizedTopic` is simply falsy and the topic-rating
 * write is skipped, same as before this step. word_bank's target identity
 * (sourceRef.id) is required by PracticeAnswer's type whenever
 * sourceRef.source === 'word_bank', so there is no "guessed row" case to
 * guard there; this function never invents/reads a target id.
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

  const attribution = answer.attribution
  const attributionVersion = attribution
    ? (answer.attributionVersion ?? ATTRIBUTION_VERSION)
    : undefined
  const exercisePayload = mergeAttributionIntoPayload(
    answer.exercisePayload,
    attribution,
    attributionVersion,
  )

  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    sound_id: answer.soundId ?? null,
    exercise_type_id: answer.exerciseTypeId,
    is_correct: answer.isCorrect,
    user_answer: answer.userAnswer ?? null,
    target_word: targetWord,
    time_ms: answer.timeMs,
    exercise_payload: (Object.keys(exercisePayload).length > 0
      ? exercisePayload
      : null) as Json | null,
    context: answer.context,
    content_id: contentId,
    topic: normalizedTopic,
  }

  const grade = answerToGrade(answer)
  const rowWithGrade = { ...row, grade }

  await db.transaction('rw', [db.syncOutbox, db.srsRatingEvents, db.srsData], async () => {
    await enqueue(userId, 'answer_history', 'upsert', rowWithGrade as Record<string, unknown>, undefined, 'id')

    // Plan 062: explicit non-SRS attribution blocks entity updates.
    const allowSrs = attribution?.srsEligible !== false
    const wordBankOutcome = attribution?.srsEligible === true
      ? attribution.outcomes.find(
          (outcome) => outcome.target.namespace === 'word_bank'
            && outcome.target.id === answer.sourceRef?.id,
        )
      : undefined
    const sourceTargetIsExplicitlyDifferent = attribution !== undefined
      && attribution.srsEligible === true
      && !wordBankOutcome

    // Enqueue SRS update for word_bank entries via the sync outbox (retried on reconnection).
    // Guard: only real UUIDs — catalog/lexicon ids must never hit word_bank PK.
    if (
      allowSrs
      && !sourceTargetIsExplicitlyDifferent
      && answer.sourceRef?.source === 'word_bank'
      && isUuid(answer.sourceRef.id)
    ) {
      await enqueueWordBankSRSUpdate(userId, answer.sourceRef.id, grade, {
        signal: 'objective_evidence',
        modality: wordBankOutcome?.modality ?? 'meaning_recall',
        attributionVersion: attributionVersion ?? ATTRIBUTION_VERSION,
      })
    } else if (allowSrs && answer.sourceRef?.source === 'text_fragments') {
      // System sentences carry no per-user Supabase row; their review state is
      // local (Dexie srsData), so this write is direct rather than via the outbox.
      await upsertFragmentSrs(answer.sourceRef.id, grade)
    }

    // Enqueue SRS update for the concept (topic) when the exercise carries one.
    if (allowSrs && normalizedTopic) {
      await enqueueTopicSRSUpdate(userId, normalizedTopic, grade)
    }
  })
}

export interface LessonQuizAnswerInput {
  questionId: string
  courseSlug: string
  lessonSlug: string
  question: string
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  timeMs: number
  topic?: string
}

export async function recordLessonQuizAttempt(
  userId: string,
  answers: LessonQuizAnswerInput[],
): Promise<{ passed: boolean; correct: number; total: number }> {
  const completedAt = new Date()
  const results: ExerciseResult[] = answers.map((answer) => ({
    exerciseId: answer.questionId,
    slug: 'multiple_choice',
    exerciseTypeId: 17,
    isCorrect: answer.isCorrect,
    userAnswer: answer.selectedAnswer,
    timeMs: answer.timeMs,
    contentId: `${answer.courseSlug}:${answer.lessonSlug}:${answer.questionId}`,
    context: 'courses',
    exercisePayload: {
      question: answer.question,
      correctAnswer: answer.correctAnswer,
      lessonSlug: answer.lessonSlug,
    },
    topic: answer.topic,
    completedAt,
  }))

  await Promise.all(results.map((result) => savePracticeAnswer(userId, result)))

  const sessionResult = buildSessionResult(results)
  await recordActivitySession(userId, {
    practiceContext: 'courses',
    sessionResult,
    metadata: {
      lessonSlug: answers[0]?.lessonSlug,
      dailyTargetId: answers[0] ? `${answers[0].courseSlug}:${answers[0].lessonSlug}` : undefined,
      quizPassed: isLessonQuizPassed(sessionResult.results.filter((r) => r.isCorrect).length, sessionResult.results.length),
    },
  })

  const correct = sessionResult.results.filter((r) => r.isCorrect).length
  return {
    passed: isLessonQuizPassed(correct, sessionResult.results.length),
    correct,
    total: sessionResult.results.length,
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
