import { describe, expect, it } from 'vitest'
import { contrastTargetId, phonemeTargetId } from '@/lib/pronunciation/targets/registry'
import {
  PronunciationDiagnosticResultSchema,
  validateDiagnosticResult,
} from '../schema'

const SCHWA = phonemeTargetId('/ə/')
const TH_CONTRAST = contrastTargetId('/θ/', '/ð/')

function baseCapabilitySnapshot() {
  return {
    micPermission: 'granted' as const,
    sttAvailable: true,
    browserSupport: 'full' as const,
    capturedAt: '2026-07-21T10:00:00.000Z',
  }
}

function measuredResult(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    targetId: SCHWA,
    status: 'observed',
    signalType: 'stt_intelligibility',
    confidence: 0.8,
    evaluatorKind: 'stt_intelligibility',
    evaluatorVersion: 'stt-v1',
    measurement: { kind: 'scored', score: 72 },
    ...overrides,
  }
}

function notMeasuredResult(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    targetId: 'prosody.word-stress',
    status: 'needs_evidence',
    signalType: 'self_report',
    confidence: 0.2,
    evaluatorKind: null,
    evaluatorVersion: null,
    measurement: {
      kind: 'not_measured',
      abstentionReason: 'no_evaluator_available',
    },
    ...overrides,
  }
}

function fivePrescriptionSessions() {
  return [
    { targetId: SCHWA, reason: 'Reinforce schwa in unstressed syllables.', style: 'drill' },
    { targetId: SCHWA, reason: 'Controlled repetition of schwa minimal contexts.', style: 'drill' },
    { targetId: TH_CONTRAST, reason: 'Perception check for θ/ð contrast.', style: 'perception' },
    { targetId: TH_CONTRAST, reason: 'Controlled production of θ/ð pairs.', style: 'drill' },
    {
      targetId: 'prosody.word-stress',
      reason: 'Transfer schwa + stress into short phrases.',
      style: 'transfer',
    },
  ]
}

function baseDiagnosticResult(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    userId: 'user-123',
    completedAt: '2026-07-21T10:05:00.000Z',
    capabilitySnapshot: baseCapabilitySnapshot(),
    selfReport: {
      overallConfidence: 'somewhat_confident',
      notes: 'I struggle with th sounds.',
    },
    targetResults: [measuredResult(), notMeasuredResult()],
    prescription: {
      generatedAt: '2026-07-21T10:05:00.000Z',
      sessions: fivePrescriptionSessions(),
    },
    ...overrides,
  }
}

describe('PronunciationDiagnosticResultSchema', () => {
  it('accepts a mixed measured / not-measured result', () => {
    const parsed = PronunciationDiagnosticResultSchema.safeParse(baseDiagnosticResult())
    expect(parsed.success).toBe(true)
  })

  it('rejects a scored target result missing evaluator version', () => {
    const result = baseDiagnosticResult({
      targetResults: [measuredResult({ evaluatorVersion: null })],
    })
    const parsed = PronunciationDiagnosticResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })

  it('rejects a scored target result missing evaluator kind', () => {
    const result = baseDiagnosticResult({
      targetResults: [measuredResult({ evaluatorKind: null })],
    })
    const parsed = PronunciationDiagnosticResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })

  it('allows not_measured targets to have null evaluator version/kind', () => {
    const result = baseDiagnosticResult({
      targetResults: [notMeasuredResult()],
    })
    const parsed = PronunciationDiagnosticResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('requires abstentionReason on not_measured results', () => {
    const result = baseDiagnosticResult({
      targetResults: [
        notMeasuredResult({
          measurement: { kind: 'not_measured' },
        }),
      ],
    })
    const parsed = PronunciationDiagnosticResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })

  it('distinguishes not_measured, failed, and low_score as separate measurement kinds', () => {
    const failed = measuredResult({
      measurement: { kind: 'failed', failureReason: 'stt_error' },
    })
    const lowScore = measuredResult({
      measurement: { kind: 'scored', score: 4 },
    })
    const result = baseDiagnosticResult({
      targetResults: [failed, lowScore, notMeasuredResult()],
    })
    const parsed = PronunciationDiagnosticResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('rejects a numeric score claim for a target whose capability is unavailable (acoustic)', () => {
    const result = baseDiagnosticResult({
      targetResults: [
        measuredResult({
          signalType: 'acoustic',
          evaluatorKind: 'acoustic',
          evaluatorVersion: 'acoustic-v1',
        }),
      ],
    })
    const parsed = PronunciationDiagnosticResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })

  it('rejects a numeric score claim for a prosody-only category (stress/rhythm/intonation)', () => {
    const result = baseDiagnosticResult({
      targetResults: [
        measuredResult({
          targetId: 'prosody.word-stress',
          signalType: 'stt_intelligibility',
        }),
      ],
    })
    const parsed = PronunciationDiagnosticResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })

  it('rejects unknown/unresolvable target ids via validateDiagnosticResult', () => {
    const result = baseDiagnosticResult({
      targetResults: [measuredResult({ targetId: 'not.a.real.target' })],
    })
    const parsed = PronunciationDiagnosticResultSchema.safeParse(result)
    expect(parsed.success).toBe(true) // shape is valid; registry check is separate
    const validation = validateDiagnosticResult(result as never)
    expect(validation.ok).toBe(false)
    if (!validation.ok) {
      expect(validation.issues.some((issue) => issue.code === 'unknown_target_id')).toBe(true)
    }
  })

  it('accepts a fully valid result end-to-end through validateDiagnosticResult', () => {
    const validation = validateDiagnosticResult(baseDiagnosticResult() as never)
    expect(validation.ok).toBe(true)
  })

  it('requires exactly five prescription sessions', () => {
    const result = baseDiagnosticResult({
      prescription: {
        generatedAt: '2026-07-21T10:05:00.000Z',
        sessions: fivePrescriptionSessions().slice(0, 4),
      },
    })
    const parsed = PronunciationDiagnosticResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })

  it('requires at least one transfer-style prescription session', () => {
    const sessions = fivePrescriptionSessions().map((s) => ({ ...s, style: 'drill' }))
    const result = baseDiagnosticResult({
      prescription: {
        generatedAt: '2026-07-21T10:05:00.000Z',
        sessions,
      },
    })
    const parsed = PronunciationDiagnosticResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })

  it('rejects more than 3 priority-status targets', () => {
    const priorityResult = (id: string) =>
      measuredResult({ targetId: id, status: 'priority', measurement: { kind: 'scored', score: 10 } })
    const result = baseDiagnosticResult({
      targetResults: [
        priorityResult(SCHWA),
        priorityResult(TH_CONTRAST),
        priorityResult(phonemeTargetId('/iː/')),
        notMeasuredResult(),
      ],
    })
    // Note: this uses 3 distinct real targets + one extra to intentionally
    // exceed the cap once a 4th priority target is added below.
    const overResult = baseDiagnosticResult({
      targetResults: [
        priorityResult(SCHWA),
        priorityResult(TH_CONTRAST),
        priorityResult(contrastTargetId('/iː/', '/ɪ/')),
        priorityResult('connected.reduction.gonna'),
      ],
    })
    expect(PronunciationDiagnosticResultSchema.safeParse(result).success).toBe(true)
    expect(PronunciationDiagnosticResultSchema.safeParse(overResult).success).toBe(false)
  })
})
