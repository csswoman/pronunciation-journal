import { describe, expect, it } from 'vitest'
import { contrastTargetId, targetId } from '@/lib/pronunciation/targets/registry'
import { applyPriorityStatus, derivePriorityTargetIds } from '../prioritization'
import type { TargetResult } from '../types'
import { TargetResultSchema } from '../types'

const TH_CONTRAST = contrastTargetId('/θ/', '/ð/')
const SHEEP_SHIP = contrastTargetId('/iː/', '/ɪ/')
const SCHWA = targetId('segmental.phoneme./ə/')
const CONNECTED_GONNA = targetId('connected.reduction.gonna')

function observedResult(overrides: Partial<TargetResult> = {}): TargetResult {
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

describe('derivePriorityTargetIds', () => {
  it('does not promote a strength-status target even with a high score', () => {
    const results: TargetResult[] = [
      observedResult({
        targetId: TH_CONTRAST,
        status: 'strength',
        confidence: 0.9,
        measurement: { kind: 'scored', score: 95 },
      }),
    ]
    expect(derivePriorityTargetIds(results)).not.toContain(TH_CONTRAST)
  })

  it('does not promote a low-confidence / not_measured result — it should keep requesting more evidence', () => {
    const results: TargetResult[] = [
      {
        targetId: SHEEP_SHIP,
        status: 'needs_evidence',
        signalType: 'stt_intelligibility',
        confidence: 0,
        evaluatorKind: null,
        evaluatorVersion: null,
        measurement: { kind: 'not_measured', abstentionReason: 'skipped_by_user' },
      },
    ]
    expect(derivePriorityTargetIds(results)).not.toContain(SHEEP_SHIP)
  })

  it('does not promote a low-confidence scored result ahead of a high-confidence one', () => {
    const lowConfidence = observedResult({ targetId: SHEEP_SHIP, confidence: 0.1, measurement: { kind: 'scored', score: 20 } })
    const highConfidence = observedResult({ targetId: SCHWA, confidence: 0.8, measurement: { kind: 'scored', score: 50 } })
    const ranked = derivePriorityTargetIds([lowConfidence, highConfidence])
    expect(ranked[0]).toBe(SCHWA)
  })

  it('caps promoted targets at 3 even when many candidates qualify', () => {
    const results: TargetResult[] = [
      observedResult({ targetId: TH_CONTRAST, measurement: { kind: 'scored', score: 10 } }),
      observedResult({ targetId: SHEEP_SHIP, measurement: { kind: 'scored', score: 20 } }),
      observedResult({ targetId: SCHWA, measurement: { kind: 'scored', score: 30 } }),
      observedResult({ targetId: CONNECTED_GONNA, measurement: { kind: 'scored', score: 40 } }),
      observedResult({ targetId: targetId('connected.linking'), measurement: { kind: 'scored', score: 50 } }),
    ]
    expect(derivePriorityTargetIds(results).length).toBeLessThanOrEqual(3)
  })

  it('applyPriorityStatus updates only the promoted subset and satisfies TargetResultSchema', () => {
    const strength = observedResult({
      targetId: TH_CONTRAST,
      status: 'strength',
      measurement: { kind: 'scored', score: 95 },
    })
    const weak = observedResult({ targetId: SCHWA, measurement: { kind: 'scored', score: 10 } })
    const updated = applyPriorityStatus([strength, weak])

    const updatedStrength = updated.find((r) => r.targetId === TH_CONTRAST)
    const updatedWeak = updated.find((r) => r.targetId === SCHWA)
    expect(updatedStrength?.status).toBe('strength')
    expect(updatedWeak?.status).toBe('priority')

    for (const result of updated) {
      expect(TargetResultSchema.safeParse(result).success).toBe(true)
    }
  })

  it('at most 3 results end up with status priority after applyPriorityStatus, regardless of candidate count', () => {
    const results: TargetResult[] = [
      observedResult({ targetId: TH_CONTRAST, measurement: { kind: 'scored', score: 10 } }),
      observedResult({ targetId: SHEEP_SHIP, measurement: { kind: 'scored', score: 15 } }),
      observedResult({ targetId: SCHWA, measurement: { kind: 'scored', score: 20 } }),
      observedResult({ targetId: CONNECTED_GONNA, measurement: { kind: 'scored', score: 25 } }),
    ]
    const updated = applyPriorityStatus(results)
    expect(updated.filter((r) => r.status === 'priority').length).toBeLessThanOrEqual(3)
  })
})
