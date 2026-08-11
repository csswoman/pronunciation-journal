import { describe, expect, it } from 'vitest'
import {
  missionForTarget,
  parseMissionLaunch,
  reconcileMissionLaunch,
  type MissionLaunchSource,
} from '../launch'
import type { MissionOutcome } from '../outcome'

const TARGET = 'segmental.phoneme./ə/'

function outcome(overrides: Partial<MissionOutcome> = {}): MissionOutcome {
  return {
    missionId: 'roleplay.airport',
    goalAchieved: true,
    intelligibilityEvidence: { attempts: [], scoredCount: 1 },
    targetEvidence: [{ targetId: TARGET as never, outcome: 'needs_more_evidence' }],
    repairUsed: false,
    unscoredReasons: [],
    ...overrides,
  }
}

describe('canonical mission launches', () => {
  it('preserves exact route target identity', () => {
    const launch = parseMissionLaunch({ missionId: 'roleplay.airport', targetIds: [TARGET], source: 'route' })
    expect(launch).toMatchObject({ missionId: 'roleplay.airport', targetIds: [TARGET], source: 'route' })
  })

  it('requires the originating daily step and exact targets', () => {
    expect(() => parseMissionLaunch({ missionId: 'roleplay.airport', targetIds: [TARGET], source: 'daily' })).toThrow(/step id/)
    expect(() => parseMissionLaunch({ missionId: 'roleplay.airport', source: 'tracking' })).toThrow(/exact target/)
  })

  it('rejects unknown sources, missions, targets, and targets from another mission', () => {
    expect(() => parseMissionLaunch({ missionId: 'roleplay.airport', source: 'bad' as MissionLaunchSource })).toThrow()
    expect(() => parseMissionLaunch({ missionId: 'missing', source: 'coach' })).toThrow()
    expect(() => parseMissionLaunch({ missionId: 'roleplay.airport', targetIds: ['missing.target'], source: 'route' })).toThrow()
    expect(() => parseMissionLaunch({ missionId: 'roleplay.airport', targetIds: ['connected.linking'], source: 'route' })).toThrow()
  })

  it('finds only authored target-to-mission links', () => {
    expect(missionForTarget(TARGET)?.id).toBe('roleplay.airport')
    expect(missionForTarget('missing.target')).toBeNull()
  })
})

describe('mission launch reconciliation', () => {
  const launch = parseMissionLaunch({
    launchId: 'daily-launch-1',
    missionId: 'roleplay.airport',
    targetIds: [TARGET],
    source: 'daily',
    stepId: 'mission:schwa',
  })

  it('closes only the exact originating daily step after goal plus target evidence', () => {
    expect(reconcileMissionLaunch(launch, outcome())).toEqual({ completed: true, stepId: 'mission:schwa' })
  })

  it('does not reconcile cancel, another mission, or another target', () => {
    expect(reconcileMissionLaunch(launch, outcome({ goalAchieved: false }))).toEqual({ completed: false, stepId: null })
    expect(reconcileMissionLaunch(launch, outcome({ missionId: 'roleplay.cafe' }))).toEqual({ completed: false, stepId: null })
    expect(reconcileMissionLaunch(launch, outcome({ targetEvidence: [] }))).toEqual({ completed: false, stepId: null })
  })
})
