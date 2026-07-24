import { describe, expect, it } from 'vitest'
import { contrastTargetId, getTarget, targetId } from '@/lib/pronunciation/targets/registry'
import { generatePrescriptionSessions } from '../prescription'
import { PronunciationWeekPrescriptionSchema } from '../schema'
import type { TargetResult } from '../types'

const TH_CONTRAST = contrastTargetId('/θ/', '/ð/')
const SHEEP_SHIP = contrastTargetId('/iː/', '/ɪ/')
const SCHWA = targetId('segmental.phoneme./ə/')

function result(overrides: Partial<TargetResult> = {}): TargetResult {
  return {
    targetId: TH_CONTRAST,
    status: 'observed',
    signalType: 'stt_intelligibility',
    confidence: 0.8,
    evaluatorKind: 'stt_intelligibility',
    evaluatorVersion: 'stt-v1',
    measurement: { kind: 'scored', score: 50 },
    ...overrides,
  }
}

function buildPrescription(sessions: ReturnType<typeof generatePrescriptionSessions>) {
  return { generatedAt: new Date().toISOString(), sessions }
}

describe('generatePrescriptionSessions', () => {
  it('produces exactly 5 sessions with at least one transfer session, referencing valid target ids', () => {
    const results: TargetResult[] = [
      result({ targetId: TH_CONTRAST, status: 'priority' }),
      result({ targetId: SHEEP_SHIP, status: 'priority' }),
      result({ targetId: SCHWA, status: 'observed' }),
    ]
    const sessions = generatePrescriptionSessions(results)

    expect(sessions).toHaveLength(5)
    expect(sessions.some((s) => s.style === 'transfer')).toBe(true)
    for (const session of sessions) {
      expect(session.reason.length).toBeGreaterThan(0)
      expect(session.reason.length).toBeLessThanOrEqual(300)
      expect(getTarget(session.targetId).ok).toBe(true)
      // Learner-facing Spanish chrome — not authoring English jargon.
      expect(session.reason).toMatch(
        /escucha|practica|repítelo|úsalo|llévalo|evidencia|focos/i
      )
    }
  })

  it('round-trips through PronunciationWeekPrescriptionSchema successfully', () => {
    const results: TargetResult[] = [
      result({ targetId: TH_CONTRAST, status: 'priority' }),
      result({ targetId: SHEEP_SHIP, status: 'observed' }),
    ]
    const sessions = generatePrescriptionSessions(results)
    const parsed = PronunciationWeekPrescriptionSchema.safeParse(buildPrescription(sessions))
    expect(parsed.success).toBe(true)
  })

  it('falls back to 5 valid sessions with a transfer slot when there are no priority targets', () => {
    const results: TargetResult[] = [result({ targetId: SCHWA, status: 'observed' })]
    const sessions = generatePrescriptionSessions(results)

    expect(sessions).toHaveLength(5)
    expect(sessions.some((s) => s.style === 'transfer')).toBe(true)
    const parsed = PronunciationWeekPrescriptionSchema.safeParse(buildPrescription(sessions))
    expect(parsed.success).toBe(true)
  })

  it('falls back to 5 valid sessions with a transfer slot when every result is not_measured', () => {
    const results: TargetResult[] = [
      {
        targetId: TH_CONTRAST,
        status: 'needs_evidence',
        signalType: 'stt_intelligibility',
        confidence: 0,
        evaluatorKind: null,
        evaluatorVersion: null,
        measurement: { kind: 'not_measured', abstentionReason: 'skipped_by_user' },
      },
    ]
    const sessions = generatePrescriptionSessions(results)

    expect(sessions).toHaveLength(5)
    expect(sessions.some((s) => s.style === 'transfer')).toBe(true)
    for (const session of sessions) {
      expect(getTarget(session.targetId).ok).toBe(true)
    }
    const parsed = PronunciationWeekPrescriptionSchema.safeParse(buildPrescription(sessions))
    expect(parsed.success).toBe(true)
  })

  it('falls back to 5 valid sessions with a transfer slot when results is empty', () => {
    const sessions = generatePrescriptionSessions([])

    expect(sessions).toHaveLength(5)
    expect(sessions.some((s) => s.style === 'transfer')).toBe(true)
    const parsed = PronunciationWeekPrescriptionSchema.safeParse(buildPrescription(sessions))
    expect(parsed.success).toBe(true)
  })

  it('cycles through fewer than 5 candidates without crashing or truncating the session count', () => {
    const results: TargetResult[] = [result({ targetId: TH_CONTRAST, status: 'priority' })]
    const sessions = generatePrescriptionSessions(results)
    expect(sessions).toHaveLength(5)
    expect(new Set(sessions.map((s) => s.targetId)).size).toBeGreaterThanOrEqual(1)
  })
})
