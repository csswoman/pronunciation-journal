import { finishAttributedContrastSessions } from '@/lib/phoneme-practice/finish-session'
import type { SessionResult } from '@/lib/practice/types'

/** Persists domain-owned progress that PracticeSession cannot infer generically. */
export async function persistReviewStepProgress(
  userId: string | null,
  result: SessionResult,
): Promise<void> {
  if (!userId) return
  await finishAttributedContrastSessions(userId, result)
}
