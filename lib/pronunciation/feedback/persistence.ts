'use client'
import { db, type PronunciationFeedbackEvidenceRecord } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import type { PronunciationFeedbackModel } from './types'
import { handoffPronunciationFeedbackToReview } from './review-handoff'

export async function persistPronunciationFeedbackEvidence(userId: string, model: PronunciationFeedbackModel, attemptPairId?: string): Promise<boolean> {
  if (!model.priority || model.outcome === 'unscored') return false
  const id = globalThis.crypto.randomUUID()
  const now = new Date().toISOString()
  const row: PronunciationFeedbackEvidenceRecord = {
    id, userId, targetId: model.priority.targetId, evaluatorKind: model.signal.kind === 'unscored' ? 'stt_intelligibility' : model.signal.kind,
    evaluatorVersion: model.signal.kind === 'unscored' ? 'unscored' : model.signal.evaluatorVersion,
    outcome: model.outcome, attemptPairId, occurredAt: now, createdAt: now,
  }
  await db.transaction('rw', [db.pronunciationFeedbackEvidence, db.syncOutbox], async () => {
    await db.pronunciationFeedbackEvidence.put(row)
    await enqueue(userId, 'pronunciation_feedback_evidence', 'insert', {
      id, user_id: userId, target_id: row.targetId, evaluator_kind: row.evaluatorKind,
      evaluator_version: row.evaluatorVersion, outcome: row.outcome, attempt_pair_id: attemptPairId ?? null, occurred_at: now,
    })
  })
  // Tracking is a best-effort secondary write; evidence remains durable if
  // its own outbox enqueue cannot be created.
  await handoffPronunciationFeedbackToReview(userId, model).catch(() => undefined)
  return true
}
