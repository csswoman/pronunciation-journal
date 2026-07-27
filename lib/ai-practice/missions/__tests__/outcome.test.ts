import { describe, expect, it } from 'vitest'
import { getMission } from '../registry'
import { createMissionState, missionReducer } from '../state-machine'
import { deriveMissionOutcome } from '../outcome'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'

const mission = getMission('roleplay.cafe')!

function attempt(overrides: Partial<SpokenAttempt> = {}): SpokenAttempt {
  return {
    userId: 'user-1',
    targetText: mission.targets[0].phrase,
    transcript: mission.targets[0].phrase,
    evaluatorVersion: 'stt-v1',
    scoreKind: 'stt_intelligibility',
    overallScore: 90,
    targetId: mission.targets[0].targetId,
    durationMs: 900,
    outcome: 'scored',
    ...overrides,
  }
}

function stateWithAllIntents() {
  return mission.requiredIntents.reduce(
    (state, intent) => missionReducer(state, { type: 'intent_observed', intentId: intent.id }, mission),
    missionReducer(createMissionState(mission.id), { type: 'turn_text' }, mission),
  )
}

describe('mission outcome evaluation', () => {
  it('can achieve the goal while pronunciation evidence remains weak/needs more evidence', () => {
    const state = missionReducer(stateWithAllIntents(), {
      type: 'turn_spoken',
      attempt: attempt({ overallScore: 35 }),
    }, mission)

    const outcome = deriveMissionOutcome(state, mission)

    expect(outcome.goalAchieved).toBe(true)
    expect(outcome.intelligibilityEvidence.scoredCount).toBe(1)
    expect(outcome.targetEvidence).toEqual([
      { targetId: mission.targets[0].targetId, outcome: 'needs_more_evidence' },
    ])
  })

  it('can have intelligible speech while the structured communicative goal is incomplete', () => {
    const state = missionReducer(missionReducer(createMissionState(mission.id), { type: 'turn_text' }, mission), {
      type: 'turn_spoken',
      attempt: attempt({ overallScore: 98 }),
    }, mission)

    const outcome = deriveMissionOutcome(state, mission)

    expect(outcome.goalAchieved).toBe(false)
    expect(outcome.intelligibilityEvidence.scoredCount).toBe(1)
    expect(outcome.targetEvidence[0].targetId).toBe(mission.targets[0].targetId)
  })

  it('records a successful clarification/repair without deriving it from model prose', () => {
    const corrected = missionReducer(stateWithAllIntents(), { type: 'turn_spoken', attempt: attempt() }, mission)
    const state = missionReducer(corrected, { type: 'retry_correction' }, mission)

    expect(deriveMissionOutcome(state, mission).repairUsed).toBe(true)
  })

  it('keeps a fully unscored fallback honest and deduplicates reasons', () => {
    const first = missionReducer(missionReducer(createMissionState(mission.id), { type: 'turn_text' }, mission), {
      type: 'turn_spoken',
      attempt: attempt({ outcome: 'unscored', transcript: '', overallScore: 0 }),
    }, mission)
    const state = missionReducer(first, {
      type: 'turn_spoken',
      attempt: attempt({ outcome: 'unscored', transcript: '', overallScore: 0 }),
    }, mission)

    const outcome = deriveMissionOutcome(state, mission)

    expect(outcome.goalAchieved).toBe(false)
    expect(outcome.intelligibilityEvidence.scoredCount).toBe(0)
    expect(outcome.targetEvidence).toEqual([])
    expect(outcome.unscoredReasons).toEqual(['unscored'])
  })

  it('does not claim improvement across an unscored attempt', () => {
    const start = missionReducer(missionReducer(createMissionState(mission.id), { type: 'turn_text' }, mission), {
      type: 'turn_spoken',
      attempt: attempt({ overallScore: 40 }),
    }, mission)
    const afterUnscored = missionReducer(start, {
      type: 'turn_spoken',
      attempt: attempt({ outcome: 'unscored', transcript: '', overallScore: 0 }),
    }, mission)
    const state = missionReducer(afterUnscored, {
      type: 'turn_spoken',
      attempt: attempt({ overallScore: 95 }),
    }, mission)

    expect(deriveMissionOutcome(state, mission).targetEvidence.at(-1)?.outcome).toBe('needs_more_evidence')
  })
})
