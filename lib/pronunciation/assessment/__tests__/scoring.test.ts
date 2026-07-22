import { describe, expect, it } from 'vitest'
import { contrastTargetId, targetId } from '@/lib/pronunciation/targets/registry'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'
import { scorePerceptionPrompt, scoreProductionPrompt } from '../scoring'
import { TargetResultSchema } from '../types'

const TH_CONTRAST = contrastTargetId('/θ/', '/ð/')

function baseAttempt(overrides: Partial<SpokenAttempt> = {}): SpokenAttempt {
  return {
    userId: 'user-1',
    targetText: 'thin vs. this',
    transcript: 'thin vs. this',
    evaluatorVersion: 'stt-v1',
    scoreKind: 'stt_intelligibility',
    overallScore: 100,
    durationMs: 1200,
    outcome: 'scored',
    ...overrides,
  }
}

describe('scoreProductionPrompt — prosody/acoustic honesty gate', () => {
  it('a transcript-perfect word-stress attempt yields not_measured, never scored/strength', () => {
    const attempt = baseAttempt({ outcome: 'scored', overallScore: 100 })
    const result = scoreProductionPrompt(
      { targetId: targetId('prosody.word-stress'), stage: 'controlled_production' },
      attempt
    )

    expect(result.measurement.kind).toBe('not_measured')
    if (result.measurement.kind === 'not_measured') {
      expect(result.measurement.abstentionReason).toBe('no_evaluator_available')
    }
    expect(result.status).toBe('needs_evidence')
    expect(result.status).not.toBe('strength')
    expect(result.status).not.toBe('priority')
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })

  it('a transcript-perfect sentence-stress attempt also abstains', () => {
    const attempt = baseAttempt({ outcome: 'scored', overallScore: 100 })
    const result = scoreProductionPrompt(
      { targetId: targetId('prosody.sentence-stress'), stage: 'contextual_production' },
      attempt
    )

    expect(result.measurement.kind).toBe('not_measured')
    expect(result.status).toBe('needs_evidence')
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })
})

describe('scoreProductionPrompt — segmental/connected-speech targets', () => {
  it('scored outcome maps to a real score with stt_intelligibility evaluator', () => {
    const attempt = baseAttempt({ outcome: 'scored', overallScore: 88, evaluatorVersion: 'stt-v2' })
    const result = scoreProductionPrompt(
      { targetId: TH_CONTRAST, stage: 'controlled_production' },
      attempt
    )

    expect(result.measurement).toEqual({ kind: 'scored', score: 88 })
    expect(result.evaluatorKind).toBe('stt_intelligibility')
    expect(result.evaluatorVersion).toBe('stt-v2')
    expect(result.status).toBe('strength')
    expect(result.confidence).toBe(0.8)
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })

  it('scored outcome below threshold is observed, not strength', () => {
    const attempt = baseAttempt({ outcome: 'scored', overallScore: 40 })
    const result = scoreProductionPrompt(
      { targetId: TH_CONTRAST, stage: 'controlled_production' },
      attempt
    )

    expect(result.measurement).toEqual({ kind: 'scored', score: 40 })
    expect(result.status).toBe('observed')
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })

  it('failed outcome maps to a failed measurement', () => {
    const attempt = baseAttempt({ outcome: 'failed' })
    const result = scoreProductionPrompt(
      { targetId: TH_CONTRAST, stage: 'controlled_production' },
      attempt
    )

    expect(result.measurement.kind).toBe('failed')
    expect(result.status).toBe('needs_evidence')
    expect(result.evaluatorKind).toBe('stt_intelligibility')
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })

  it('unscored outcome maps to not_measured with stt_unavailable', () => {
    const attempt = baseAttempt({ outcome: 'unscored' })
    const result = scoreProductionPrompt(
      { targetId: TH_CONTRAST, stage: 'controlled_production' },
      attempt
    )

    expect(result.measurement).toEqual({ kind: 'not_measured', abstentionReason: 'stt_unavailable' })
    expect(result.evaluatorKind).toBeNull()
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })

  it('skipped outcome maps to not_measured with skipped_by_user', () => {
    const attempt = baseAttempt({ outcome: 'skipped' })
    const result = scoreProductionPrompt(
      { targetId: TH_CONTRAST, stage: 'controlled_production' },
      attempt
    )

    expect(result.measurement).toEqual({ kind: 'not_measured', abstentionReason: 'skipped_by_user' })
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })

  it('unknown target id abstains rather than throwing', () => {
    const attempt = baseAttempt({ outcome: 'scored', overallScore: 100 })
    const result = scoreProductionPrompt(
      { targetId: targetId('segmental.phoneme.not-real'), stage: 'controlled_production' },
      attempt
    )

    expect(result.measurement.kind).toBe('not_measured')
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })
})

describe('scorePerceptionPrompt', () => {
  it('a correct answer scores as perception, never self_report, never via SpokenAttempt', () => {
    const result = scorePerceptionPrompt({ targetId: TH_CONTRAST, stage: 'perception' }, { correct: true })

    expect(result.signalType).toBe('perception')
    expect(result.signalType).not.toBe('self_report')
    expect(result.measurement).toEqual({ kind: 'scored', score: 100 })
    expect(result.evaluatorKind).not.toBeNull()
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })

  it('a scored perception result gets confidence 0.6, not 0.8 (regression: must key off signalType, not evaluatorKind)', () => {
    const result = scorePerceptionPrompt({ targetId: TH_CONTRAST, stage: 'perception' }, { correct: true })

    expect(result.confidence).toBe(0.6)
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })

  it('an incorrect answer scores 0, still perception', () => {
    const result = scorePerceptionPrompt({ targetId: TH_CONTRAST, stage: 'perception' }, { correct: false })

    expect(result.signalType).toBe('perception')
    expect(result.measurement).toEqual({ kind: 'scored', score: 0 })
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })

  it('a missing answer yields not_measured', () => {
    const result = scorePerceptionPrompt({ targetId: TH_CONTRAST, stage: 'perception' }, null)

    expect(result.measurement).toEqual({ kind: 'not_measured', abstentionReason: 'skipped_by_user' })
    expect(result.signalType).toBe('perception')
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })
})
