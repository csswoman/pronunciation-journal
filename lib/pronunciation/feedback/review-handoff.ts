import { saveTrackedItem } from '@/lib/tracking/queries'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import type { PronunciationFeedbackModel } from './types'

/** Sends a canonical target to the existing Tracking queue; no new SRS namespace. */
export async function handoffPronunciationFeedbackToReview(userId: string, model: PronunciationFeedbackModel): Promise<boolean> {
  if (!model.priority || !model.reviewRecommended) return false
  const copy = getLearnerTargetCopy(model.priority.targetId)
  await saveTrackedItem({
    userId, kind: 'phrase', ref: `pronunciation:${model.priority.targetId}`,
    title: copy.title, payload: { targetId: model.priority.targetId, source: 'pronunciation_feedback' },
  })
  return true
}
