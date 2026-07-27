import { describe, expect, it } from 'vitest'
import { parseMissionLaunch, type MissionLaunchSource } from '../launch'

describe('parseMissionLaunch', () => {
  it('parses a full launch payload', () => {
    const launch = parseMissionLaunch({ missionId: 'roleplay.cafe', targetIds: ['segmental.phoneme./ə/'], source: 'route' })

    expect(launch).toEqual({ missionId: 'roleplay.cafe', targetIds: ['segmental.phoneme./ə/'], source: 'route' })
  })

  it('defaults targetIds to an empty array when omitted', () => {
    const launch = parseMissionLaunch({ missionId: 'roleplay.cafe', source: 'coach' })

    expect(launch.targetIds).toEqual([])
  })

  it('rejects an unknown source', () => {
    expect(() => parseMissionLaunch({ missionId: 'roleplay.cafe', source: 'not-a-source' as MissionLaunchSource })).toThrow()
  })

  it('rejects an unknown missionId', () => {
    expect(() => parseMissionLaunch({ missionId: 'not.a.mission', source: 'coach' })).toThrow()
  })
})
