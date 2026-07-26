import { describe, expect, it } from 'vitest'
import { phonemeTargetId, targetId } from '@/lib/pronunciation/targets/registry'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'
import { getPathUnit } from '../curriculum'
import {
  deriveUnitLearningState,
  showNeedsEvidenceBadge,
  type PathSpokenEvidence,
} from '../unit-state'

const SCHWA = phonemeTargetId('/ə/')

function evidence(overrides: Partial<PathSpokenEvidence> = {}): PathSpokenEvidence {
  return {
    targetId: SCHWA,
    outcome: 'scored',
    attemptedAt: '2026-07-20T12:00:00.000Z',
    ...overrides,
  }
}

describe('deriveUnitLearningState', () => {
  const unit = getPathUnit(SCHWA)!

  it('is not_started with no completion and no scorables', () => {
    expect(
      deriveUnitLearningState({
        unit,
        completedContentKeys: new Set(),
        spokenAttempts: [],
      })
    ).toBe('not_started')
  })

  it('is learning when content is complete but no objective production yet', () => {
    expect(
      deriveUnitLearningState({
        unit,
        completedContentKeys: new Set(['public_lesson:schwa-sound']),
        spokenAttempts: [],
      })
    ).toBe('learning')
  })

  it('ignores unscored attempts', () => {
    expect(
      deriveUnitLearningState({
        unit,
        completedContentKeys: new Set(),
        spokenAttempts: [evidence({ outcome: 'unscored' })],
      })
    ).toBe('not_started')
  })

  it('is ready_for_transfer when content done and one scorable exists', () => {
    expect(
      deriveUnitLearningState({
        unit,
        completedContentKeys: new Set(['public_lesson:schwa-sound']),
        spokenAttempts: [evidence()],
      })
    ).toBe('ready_for_transfer')
  })

  it('is retained with scorables on two distinct UTC days when masteryEligible', () => {
    expect(
      deriveUnitLearningState({
        unit,
        completedContentKeys: new Set(['public_lesson:schwa-sound']),
        spokenAttempts: [
          evidence({ attemptedAt: '2026-07-20T12:00:00.000Z' }),
          evidence({ attemptedAt: '2026-07-22T12:00:00.000Z' }),
        ],
      })
    ).toBe('retained')
  })

  it('does not retain masteryEligible:false targets from STT alone', () => {
    const rhythm = getPathUnit(targetId('prosody.rhythm'))!
    expect(
      deriveUnitLearningState({
        unit: rhythm,
        completedContentKeys: new Set(),
        spokenAttempts: [
          evidence({
            targetId: rhythm.targetId,
            attemptedAt: '2026-07-20T12:00:00.000Z',
          }),
          evidence({
            targetId: rhythm.targetId,
            attemptedAt: '2026-07-22T12:00:00.000Z',
          }),
        ],
      })
    ).not.toBe('retained')
  })
})

describe('showNeedsEvidenceBadge', () => {
  it('is true only for needs_evidence diagnostic rows', () => {
    const row: TargetResult = {
      targetId: SCHWA,
      status: 'needs_evidence',
      signalType: 'stt_intelligibility',
      confidence: 0,
      evaluatorKind: null,
      evaluatorVersion: null,
      measurement: { kind: 'not_measured', abstentionReason: 'skipped_by_user' },
    }
    expect(showNeedsEvidenceBadge(row)).toBe(true)
    expect(showNeedsEvidenceBadge({ ...row, status: 'observed' })).toBe(false)
  })
})
