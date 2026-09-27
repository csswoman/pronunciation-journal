import { savePracticeAnswer } from './answer-queries'
export { savePracticeAnswer } from './answer-queries'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
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
  PracticeContext,
  ExerciseResult,
  SessionResult,
} from './types'

function supabase() {
  return getSupabaseBrowserClient()
}

export const LESSON_QUIZ_PASS_THRESHOLD = 0.7

export const QUARANTINED_LESSON_SLUGS = new Set<string>([
  // All previously corrupt lessons (subjunctive, silent-letters, noun-verb-pairs, second-conditional,
  // question-tags, prepositions-time, modal-verbs-ability, relative-clauses) have been repaired.
])

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
    await enqueue(user.id, 'lesson_completions', 'upsert', {
      user_id: user.id, course_slug: courseSlug, lesson_slug: lessonSlug,
      completed_at: completedAt, source: 'lesson_completion', updated_at: completedAt,
    }, undefined, 'user_id,course_slug,lesson_slug')
  })
}

/** Reverses only the completion marker; genuine quiz answers/sessions remain evidence. */
export async function recordLessonIncomplete(courseSlug: string, lessonSlug: string): Promise<void> {
  const { data: { user } } = await supabase().auth.getUser()
  if (!user) throw new Error('Cannot remove lesson completion without an authenticated user')

  await db.transaction('rw', [db.completedLessons, db.syncOutbox], async () => {
    await markLessonIncomplete(user.id, courseSlug, lessonSlug)
    await enqueue(user.id, 'lesson_completions', 'delete', {}, {
      user_id: user.id, course_slug: courseSlug, lesson_slug: lessonSlug,
    })
  })
}

export interface LessonQuizAnswerInput {
  attemptId?: string
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

export interface RecordLessonQuizOptions {
  attemptId?: string
}

export async function recordLessonQuizAttempt(
  userId: string,
  answers: LessonQuizAnswerInput[],
  options?: RecordLessonQuizOptions,
): Promise<{ passed: boolean; correct: number; total: number }> {
  const completedAt = new Date()
  const isQuarantined = answers[0]?.lessonSlug ? QUARANTINED_LESSON_SLUGS.has(answers[0].lessonSlug) : false

  const results: ExerciseResult[] = answers.map((answer) => ({
    attemptId: answer.attemptId ?? (options?.attemptId ? `${options.attemptId}:${answer.questionId}` : undefined),
    exerciseId: answer.questionId,
    slug: 'multiple_choice',
    exerciseTypeId: 17,
    isCorrect: answer.isCorrect,
    userAnswer: answer.selectedAnswer,
    timeMs: answer.timeMs,
    status: isQuarantined ? 'unscored' : 'answered',
    contentId: `${answer.courseSlug}:${answer.lessonSlug}:${answer.questionId}`,
    context: 'courses',
    exercisePayload: {
      question: answer.question,
      correctAnswer: answer.correctAnswer,
      lessonSlug: answer.lessonSlug,
      quarantined: isQuarantined ? true : undefined,
    },
    topic: answer.topic,
    completedAt,
  }))

  if (!isQuarantined) {
    await Promise.all(results.map((result) => savePracticeAnswer(userId, result)))
  }

  const sessionResult = buildSessionResult(results)
  const activitySessionId = options?.attemptId ?? answers[0]?.attemptId

  if (activitySessionId) {
    const hasRecordedSession = await db.syncOutbox
      .where('userId').equals(userId)
      .and((entry) => entry.table === 'activity_sessions' && entry.payload.id === activitySessionId)
      .first()
    if (hasRecordedSession) {
      const correct = sessionResult.results.filter((r) => r.isCorrect).length
      return {
        passed: isLessonQuizPassed(correct, sessionResult.results.length),
        correct,
        total: sessionResult.results.length,
      }
    }
  }

  await recordActivitySession(userId, {
    practiceContext: 'courses',
    sessionResult,
    activitySessionId,
    metadata: {
      lessonSlug: answers[0]?.lessonSlug,
      dailyTargetId: answers[0] ? `${answers[0].courseSlug}:${answers[0].lessonSlug}` : undefined,
      quizPassed: isQuarantined ? false : isLessonQuizPassed(sessionResult.results.filter((r) => r.isCorrect).length, sessionResult.results.length),
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
