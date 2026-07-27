import { getMission } from './registry'

export type MissionLaunchSource = 'route' | 'daily' | 'tracking' | 'coach'

export interface MissionLaunch {
  missionId: string
  targetIds: string[]
  source: MissionLaunchSource
}

const VALID_SOURCES: readonly MissionLaunchSource[] = ['route', 'daily', 'tracking', 'coach']

export function parseMissionLaunch(input: {
  missionId: string
  targetIds?: string[]
  source: MissionLaunchSource
}): MissionLaunch {
  if (!VALID_SOURCES.includes(input.source)) {
    throw new Error(`Unknown mission launch source: ${input.source}`)
  }
  if (!getMission(input.missionId)) {
    throw new Error(`Unknown mission id: ${input.missionId}`)
  }

  return {
    missionId: input.missionId,
    targetIds: input.targetIds ?? [],
    source: input.source,
  }
}
