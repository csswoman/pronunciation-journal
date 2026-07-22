/**
 * Shared valid `PronunciationDiagnosticResult` builder for persistence /
 * route tests (plan 067 step 6). Mirrors the fixture shape already used by
 * `schema.test.ts` so results built here pass `validateDiagnosticResult`.
 */
import { contrastTargetId, phonemeTargetId } from '@/lib/pronunciation/targets/registry'
import type { PronunciationDiagnosticResult } from '../schema'

const SCHWA = phonemeTargetId('/ə/')
const TH_CONTRAST = contrastTargetId('/θ/', '/ð/')

export function buildValidDiagnosticResult(
  userId = 'user-123',
  overrides: Partial<PronunciationDiagnosticResult> = {}
): PronunciationDiagnosticResult {
  return {
    userId,
    completedAt: '2026-07-21T10:05:00.000Z',
    capabilitySnapshot: {
      micPermission: 'granted',
      sttAvailable: true,
      browserSupport: 'full',
      capturedAt: '2026-07-21T10:00:00.000Z',
    },
    selfReport: {
      overallConfidence: 'somewhat_confident',
      notes: 'I struggle with th sounds.',
    },
    targetResults: [
      {
        targetId: SCHWA,
        status: 'observed',
        signalType: 'stt_intelligibility',
        confidence: 0.8,
        evaluatorKind: 'stt_intelligibility',
        evaluatorVersion: 'stt-v1',
        measurement: { kind: 'scored', score: 72 },
      },
      {
        targetId: 'prosody.word-stress',
        status: 'needs_evidence',
        signalType: 'self_report',
        confidence: 0.2,
        evaluatorKind: null,
        evaluatorVersion: null,
        measurement: { kind: 'not_measured', abstentionReason: 'no_evaluator_available' },
      },
    ],
    prescription: {
      generatedAt: '2026-07-21T10:05:00.000Z',
      sessions: [
        { targetId: SCHWA, reason: 'Reinforce schwa in unstressed syllables.', style: 'drill' },
        { targetId: SCHWA, reason: 'Controlled repetition of schwa minimal contexts.', style: 'drill' },
        { targetId: TH_CONTRAST, reason: 'Perception check for θ/ð contrast.', style: 'perception' },
        { targetId: TH_CONTRAST, reason: 'Controlled production of θ/ð pairs.', style: 'drill' },
        {
          targetId: 'prosody.word-stress',
          reason: 'Transfer schwa + stress into short phrases.',
          style: 'transfer',
        },
      ],
    },
    ...overrides,
  }
}
