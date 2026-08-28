import { describe, expect, it, vi } from 'vitest'
import { getMission } from '../registry'
import {
  createMissionState,
  missionReducer,
  type MissionState,
} from '../state-machine'
import type { ConversationalMission } from '../types'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'

const mission = getMission('roleplay.cafe') as ConversationalMission


function attempt(overrides: Partial<SpokenAttempt> = {}): SpokenAttempt {
  return {
    userId: 'user-1',
    targetText: "I'd like a medium latte, please.",
    transcript: "I'd like a medium latte, please.",
    evaluatorVersion: 'stt-v1',
    scoreKind: 'stt_intelligibility',
    overallScore: 72,
    targetId: mission.targets[0].targetId,
    durationMs: 900,
    outcome: 'scored',
    ...overrides,
  }
}

function activeState(): MissionState {
  return missionReducer(createMissionState(mission.id), { type: 'turn_text' }, mission)
}

describe('oral mission state machine', () => {
  it('starts in briefing and enters active on a text turn without oral evidence', () => {
    const state = missionReducer(createMissionState(mission.id), { type: 'turn_text' }, mission)

    expect(state.phase).toBe('active')
    expect(state.turnCount).toBe(1)
    expect(state.spokenAttempts).toEqual([])
  })

  it('accepts authorized intents and ignores duplicate or unknown intent ids', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    const initial = activeState()
    const first = missionReducer(initial, { type: 'intent_observed', intentId: 'placed_order' }, mission)
    const duplicate = missionReducer(first, { type: 'intent_observed', intentId: 'placed_order' }, mission)
    const unknown = missionReducer(duplicate, { type: 'intent_observed', intentId: 'not_authorized' }, mission)

    expect([...unknown.intentsObserved]).toEqual(['placed_order'])
    expect(unknown).toEqual(duplicate)
    expect(debug).toHaveBeenCalledWith('Ignored unknown oral mission intent', {
      missionId: mission.id,
      intentId: 'not_authorized',
    })
    debug.mockRestore()
  })

  it('keeps unscored spoken attempts in history without opening correction', () => {
    const state = missionReducer(activeState(), {
      type: 'turn_spoken',
      attempt: attempt({ outcome: 'unscored', transcript: '' }),
    }, mission)

    expect(state.phase).toBe('active')
    expect(state.spokenAttempts).toHaveLength(1)
    expect(state.pendingCorrection).toBeNull()
  })

  it('opens at most one prioritized correction for a scored target', () => {
    const state = missionReducer(activeState(), { type: 'turn_spoken', attempt: attempt() }, mission)

    expect(state.phase).toBe('correction')
    expect(state.pendingCorrection?.targetId).toBe(mission.targets[0].targetId)
    expect(state.spokenAttempts).toHaveLength(1)
  })

  it('requires a spoken retry before moving to transfer', () => {
    const correction = missionReducer(
      missionReducer(activeState(), { type: 'turn_spoken', attempt: attempt() }, mission),
      { type: 'retry_correction' },
      mission,
    )
    const unrelatedAttempt = missionReducer(correction, {
      type: 'turn_spoken',
      attempt: attempt({ targetId: mission.targets[1].targetId }),
    }, mission)
    const unscoredRetry = missionReducer(correction, {
      type: 'turn_spoken',
      attempt: attempt({ outcome: 'unscored', transcript: '' }),
    }, mission)
    const retried = missionReducer(correction, {
      type: 'turn_spoken',
      attempt: attempt({ targetText: 'A medium latte, please.' }),
    }, mission)
    const transfer = missionReducer(retried, {
      type: 'transfer_attempted',
      attempt: attempt({ targetText: 'Can I get that to go?', targetId: mission.targets[1].targetId }),
    }, mission)

    expect(correction.phase).toBe('active')
    expect(correction.correctionRetried).toBe(true)
    expect(correction.spokenAttempts).toHaveLength(1)
    expect(unrelatedAttempt.phase).toBe('active')
    expect(unscoredRetry.phase).toBe('active')
    expect(unscoredRetry.spokenAttempts).toHaveLength(2)
    expect(retried.phase).toBe('transfer')
    expect(retried.spokenAttempts).toHaveLength(2)
    expect(retried.spokenAttempts[1]).toMatchObject({
      targetId: correction.pendingCorrection?.targetId,
      targetText: 'A medium latte, please.',
    })
    expect(transfer.phase).toBe('result')
    expect(transfer.transferAttempted).toBe(true)
    expect(transfer.status).toBe('completed')
    expect(transfer.spokenAttempts).toHaveLength(3)
  })

  it('forces a result at the mission turn quota', () => {
    const shortMission = { ...mission, maxTurns: 1 }
    const state = missionReducer(createMissionState(shortMission.id), { type: 'turn_text' }, shortMission)

    expect(state.phase).toBe('result')
    expect(state.status).toBe('completed')
  })

  it('preserves evidence on cancel, provider failure, and resume', () => {
    const withAttempt = missionReducer(activeState(), { type: 'turn_spoken', attempt: attempt() }, mission)
    const cancelled = missionReducer(withAttempt, { type: 'cancel' }, mission)
    const failed = missionReducer(withAttempt, { type: 'provider_error' }, mission)
    const resumed = missionReducer(createMissionState(mission.id), { type: 'resume', from: withAttempt }, mission)

    expect(cancelled.status).toBe('cancelled')
    expect(failed.status).toBe('provider_error')
    expect(cancelled.spokenAttempts).toHaveLength(1)
    expect(failed.spokenAttempts).toHaveLength(1)
    expect(resumed).not.toBe(withAttempt)
    expect(resumed.intentsObserved).not.toBe(withAttempt.intentsObserved)
    expect(resumed).toEqual(withAttempt)
  })
})
