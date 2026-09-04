import { enqueue } from '@/lib/sync/sync-manager'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import type { SessionResult } from '@/lib/practice/types'

export interface ReaderShadowingAttemptInput {
  passageId: string
  sentenceText: string
  accuracy: number
  transcript: string
  timeMs: number
}

const SHADOWING_SUCCESS_THRESHOLD = 70

/**
 * Persiste un intento de shadowing oral en el Reader hacia `answer_history`
 * y `activity_sessions` de manera offline-first mediante el outbox.
 *
 * `exercise_type_id: 16` corresponde a `spoken_production` (producción oral).
 * `context` es `'practice'` (la superficie canónica registrada para Reader).
 */
export async function recordReaderShadowingAttempt(
  userId: string,
  input: ReaderShadowingAttemptInput,
): Promise<void> {
  const isCorrect = input.accuracy >= SHADOWING_SUCCESS_THRESHOLD
  const attemptId = `reader_sh_${input.passageId}_${Date.now()}`

  const answerRow = {
    id: attemptId,
    user_id: userId,
    exercise_type_id: 16,
    is_correct: isCorrect,
    score: input.accuracy,
    user_answer: input.transcript,
    target_word: input.sentenceText,
    time_ms: input.timeMs,
    exercise_payload: {
      modality: 'shadowing',
      surface: 'reader',
      passageId: input.passageId,
      transcript: input.transcript,
      accuracy: input.accuracy,
    },
    context: 'practice' as const,
    topic: 'shadowing',
  }

  await enqueue(
    userId,
    'answer_history',
    'upsert',
    answerRow as Record<string, unknown>,
    undefined,
    'id',
  )

  await recordActivitySession(userId, {
    practiceContext: 'practice',
    source: 'practice',
    sessionResult: {
      results: [
        {
          exerciseId: `reader-${input.passageId}`,
          slug: 'spoken_production',
          exerciseTypeId: 16,
          contentId: `reader:${input.passageId}`,
          context: 'practice',
          isCorrect,
          score: input.accuracy,
          timeMs: input.timeMs,
          userAnswer: input.transcript,
          completedAt: new Date(),
        },
      ],
      accuracy: input.accuracy,
      totalTimeMs: input.timeMs,
      bySlug: {} as SessionResult['bySlug'],
    },
    metadata: { dailyTargetId: `reader.shadowing.${input.passageId}` },
  })
}
