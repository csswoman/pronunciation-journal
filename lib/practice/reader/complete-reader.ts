import { recordActivitySession } from '@/lib/progress/activity-hub'
import { savePracticeAnswer } from '@/lib/practice/queries'
import { buildSessionResult } from '@/lib/practice/session-result'
import { flushOutbox } from '@/lib/sync/sync-manager'

export type ReaderCompletionContext = 'practice' | 'daily'

export interface CompleteReaderInput {
  userId: string
  passageId: string
  correct: boolean
  context: ReaderCompletionContext
}

/** Persists the answer and activity telemetry for a completed Reader passage. */
export async function completeReader({
  userId,
  passageId,
  correct,
  context,
}: CompleteReaderInput): Promise<void> {
  const result = {
    exerciseId: `reader:${passageId}`,
    slug: 'multiple_choice' as const,
    exerciseTypeId: 17,
    isCorrect: correct,
    timeMs: 0,
    contentId: passageId,
    context,
    completedAt: new Date(),
  }

  await savePracticeAnswer(userId, result)
  await recordActivitySession(userId, {
    practiceContext: context,
    source: 'practice',
    sessionResult: buildSessionResult([result]),
  })
  await flushOutbox()
}
