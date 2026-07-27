import { describe, expect, it, vi } from 'vitest'
const trackingMocks = vi.hoisted(() => ({ saveTrackedItem: vi.fn() }))
vi.mock('@/lib/tracking/queries', () => ({ saveTrackedItem: trackingMocks.saveTrackedItem }))
import { handoffPronunciationFeedbackToReview } from '../review-handoff'
import type { PronunciationFeedbackModel } from '../types'

const model: PronunciationFeedbackModel = {
  version: 1, signal: { kind: 'stt_intelligibility', evaluatorVersion: 'stt-v1', confidence: 1, transcript: '', recognizedPercent: 60 },
  outcome: 'needs_more_evidence', priority: { targetId: 'segmental.contrast./θ/|/ð/' as never }, summaryEs: '', reviewRecommended: true,
}

describe('pronunciation feedback review handoff', () => {
  it('uses the existing Tracking item contract for a canonical target', async () => {
    trackingMocks.saveTrackedItem.mockResolvedValue(undefined)
    await expect(handoffPronunciationFeedbackToReview('user-a', model)).resolves.toBe(true)
    expect(trackingMocks.saveTrackedItem).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-a', kind: 'phrase', ref: `pronunciation:${model.priority!.targetId}` }))
  })
  it('does not enqueue unscored evidence', async () => {
    trackingMocks.saveTrackedItem.mockClear()
    await expect(handoffPronunciationFeedbackToReview('user-a', { ...model, outcome: 'unscored', priority: null, reviewRecommended: false })).resolves.toBe(false)
    expect(trackingMocks.saveTrackedItem).not.toHaveBeenCalled()
  })
})
