// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { persistPronunciationFeedbackEvidence } from '../persistence'
import type { PronunciationFeedbackModel } from '../types'

const model: PronunciationFeedbackModel = {
  version: 1, signal: { kind: 'stt_intelligibility', evaluatorVersion: 'stt-v1', confidence: 1, transcript: 'thin', recognizedPercent: 80 },
  outcome: 'needs_more_evidence', priority: { targetId: 'segmental.contrast./θ/|/ð/' as never },
  summaryEs: '', reviewRecommended: true,
}

describe('persistPronunciationFeedbackEvidence', () => {
  beforeEach(async () => { db.close(); await db.delete(); await db.open() })
  afterEach(() => db.close())

  it('writes a user-scoped row and matching outbox entry without transcript or audio', async () => {
    expect(await persistPronunciationFeedbackEvidence('account-a', model, 'pair-1')).toBe(true)
    expect(await db.pronunciationFeedbackEvidence.where('userId').equals('account-a').count()).toBe(1)
    expect(await db.pronunciationFeedbackEvidence.where('userId').equals('account-b').count()).toBe(0)
    const entry = await db.syncOutbox.filter((row) => row.table === 'pronunciation_feedback_evidence').first()
    expect(entry?.payload).not.toHaveProperty('transcript')
    expect(entry?.payload).not.toHaveProperty('audio')
  })

  it('does not persist an unscored or targetless result', async () => {
    expect(await persistPronunciationFeedbackEvidence('account-a', { ...model, outcome: 'unscored', priority: null })).toBe(false)
    expect(await db.pronunciationFeedbackEvidence.count()).toBe(0)
  })
})
