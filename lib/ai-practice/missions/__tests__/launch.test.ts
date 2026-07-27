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

describe('parseMissionLaunch — per-source contracts', () => {
  it('route launches carry the transfer step target ids', () => {
    const launch = parseMissionLaunch({
      missionId: 'roleplay.cafe',
      targetIds: ['segmental.contrast.iː|ɪ'],
      source: 'route',
    })

    expect(launch.source).toBe('route')
    expect(launch.targetIds).toContain('segmental.contrast.iː|ɪ')
  })

  it('daily launches carry no target ids unless explicitly seeded', () => {
    const launch = parseMissionLaunch({ missionId: 'roleplay.standup', source: 'daily' })

    expect(launch.source).toBe('daily')
    expect(launch.targetIds).toEqual([])
  })

  it('tracking launches seed target ids without mutating the mission', () => {
    const launch = parseMissionLaunch({
      missionId: 'roleplay.doctor',
      targetIds: ['segmental.contrast.θ|ð'],
      source: 'tracking',
    })

    expect(launch.source).toBe('tracking')
  })

  it('direct coach launches have source coach and no seeded targets', () => {
    const launch = parseMissionLaunch({ missionId: 'roleplay.airport', source: 'coach' })

    expect(launch.source).toBe('coach')
    expect(launch.targetIds).toEqual([])
  })
})
