import { describe, expect, it } from 'vitest'
import { contrastTargetId, targetId } from '@/lib/pronunciation/targets/registry'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'
import { generatePrescriptionSessions } from '../prescription'
import { applyPriorityStatus } from '../prioritization'
import { validateDiagnosticResult } from '../schema'
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

  it('explicit skip on prosody-only production is skipped_by_user, not no_evaluator', () => {
    const result = scoreProductionPrompt(
      { targetId: targetId('prosody.word-stress'), stage: 'controlled_production' },
      baseAttempt({ outcome: 'skipped' })
    )

    expect(result.measurement).toEqual({ kind: 'not_measured', abstentionReason: 'skipped_by_user' })
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
    expect(result.status).toBe('observed')
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
  it('a non-audio prompt scores as self_report with not_measured, never fake objective perception', () => {
    const result = scorePerceptionPrompt({ targetId: TH_CONTRAST, stage: 'perception' }, { correct: true })

    expect(result.signalType).toBe('self_report')
    expect(result.measurement).toEqual({ kind: 'not_measured', abstentionReason: 'no_evaluator_available' })
    expect(result.evaluatorKind).toBeNull()
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })

  it('a self_report perception result gets low confidence (0.15/0.4)', () => {
    const resultCorrect = scorePerceptionPrompt({ targetId: TH_CONTRAST, stage: 'perception' }, { correct: true })
    const resultIncorrect = scorePerceptionPrompt({ targetId: TH_CONTRAST, stage: 'perception' }, { correct: false })

    expect(resultCorrect.confidence).toBe(0.15)
    expect(resultIncorrect.confidence).toBe(0.4)
    expect(TargetResultSchema.safeParse(resultCorrect).success).toBe(true)
  })

  it('a missing answer yields not_measured with skipped_by_user', () => {
    const result = scorePerceptionPrompt({ targetId: TH_CONTRAST, stage: 'perception' }, null)

    expect(result.measurement).toEqual({ kind: 'not_measured', abstentionReason: 'skipped_by_user' })
    expect(result.signalType).toBe('perception')
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })

  it('word-stress listening perception with audio is objective evidence, not a self report', () => {
    const result = scorePerceptionPrompt(
      { targetId: targetId('prosody.word-stress'), stage: 'perception' },
      { correct: true }
    )

    expect(result.signalType).toBe('perception')
    expect(result.measurement).toEqual({ kind: 'scored', score: 100 })
    expect(result.confidence).toBe(0.6)
    expect(result.evaluatorKind).toBe('perception_forced_choice')
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })

  it('preserves the score from a multi-item word-stress listening test', () => {
    const result = scorePerceptionPrompt(
      { targetId: targetId('prosody.word-stress'), stage: 'perception' },
      { correct: false, score: 60 }
    )

    expect(result.measurement).toEqual({ kind: 'scored', score: 60 })
    expect(result.evaluatorVersion).toBe('word-stress-listening-v1')
  })

  it('carries perceptionItemCount from the answer onto the word-stress result', () => {
    const result = scorePerceptionPrompt(
      { targetId: targetId('prosody.word-stress'), stage: 'perception' },
      { correct: false, score: 60, perceptionItemCount: 5 }
    )

    expect(result.perceptionItemCount).toBe(5)
    expect(result.measurement).toEqual({ kind: 'scored', score: 60 })
    expect(TargetResultSchema.safeParse(result).success).toBe(true)
  })

  it('other prosody targets remain self-report until they get an audio item', () => {
    const struggle = scorePerceptionPrompt(
      { targetId: targetId('prosody.rhythm'), stage: 'perception' },
      { correct: false }
    )
    const comfort = scorePerceptionPrompt(
      { targetId: targetId('prosody.rhythm'), stage: 'perception' },
      { correct: true }
    )

    expect(struggle.signalType).toBe('self_report')
    expect(struggle.confidence).toBe(0.4)
    expect(comfort.confidence).toBe(0.15)
    expect(struggle.confidence).toBeGreaterThan(comfort.confidence)
  })

  it('a finished diagnostic that answered prosody perception still validates end-to-end', () => {
    const targetResults = applyPriorityStatus([
      scorePerceptionPrompt(
        { targetId: targetId('prosody.word-stress'), stage: 'perception' },
        { correct: true }
      ),
      scorePerceptionPrompt({ targetId: TH_CONTRAST, stage: 'perception' }, { correct: false }),
    ])
    const sessions = generatePrescriptionSessions(targetResults)
    const validation = validateDiagnosticResult({
      userId: 'user-1',
      completedAt: new Date().toISOString(),
      capabilitySnapshot: {
        micPermission: 'granted',
        sttAvailable: true,
        browserSupport: 'full',
        capturedAt: new Date().toISOString(),
      },
      selfReport: { overallConfidence: 'somewhat_confident' },
      targetResults,
      prescription: { generatedAt: new Date().toISOString(), sessions },
    })

    expect(validation.ok).toBe(true)
  })
})
