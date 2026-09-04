import { getMission, listMissions } from './registry'
import { isScriptedMission, type ScriptedMission } from './types'
import { getTarget } from '@/lib/pronunciation/targets/registry'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import type { MissionOutcome } from './outcome'

export type MissionLaunchSource = 'route' | 'daily' | 'tracking' | 'sound_lab' | 'coach'

export interface MissionLaunch {
  launchId: string
  missionId: string
  targetIds: PronunciationTargetId[]
  source: MissionLaunchSource
  stepId?: string
}
const VALID_SOURCES: readonly MissionLaunchSource[] = ['route', 'daily', 'tracking', 'sound_lab', 'coach']

function stableLaunchId(input: {
  missionId: string
  targetIds: readonly string[]
  source: MissionLaunchSource
  stepId?: string
}): string {
  return ['mission-launch', input.source, input.stepId ?? 'direct', input.missionId, ...input.targetIds].join(':')
}

export function parseMissionLaunch(input: {
  launchId?: string
  missionId: string
  targetIds?: string[]
  source: MissionLaunchSource
  stepId?: string
}): MissionLaunch {
  if (!VALID_SOURCES.includes(input.source)) {
    throw new Error(`Unknown mission launch source: ${input.source}`)
  }
  const mission = getMission(input.missionId)
  if (!mission) throw new Error(`Unknown mission id: ${input.missionId}`)
  if (input.source === 'daily' && !input.stepId) {
    throw new Error('Daily mission launches require the originating step id')
  }

  const requested = input.targetIds ?? []
  const missionTargetIds = new Set(mission.targets.map((target) => target.targetId))
  const targetIds: PronunciationTargetId[] = []
  for (const candidate of requested) {
    const lookup = getTarget(candidate)
    if (!lookup.ok || !missionTargetIds.has(candidate as PronunciationTargetId)) {
      throw new Error(`Mission ${mission.id} does not author target ${candidate}`)
    }
    if (!targetIds.includes(candidate as PronunciationTargetId)) {
      targetIds.push(candidate as PronunciationTargetId)
    }
  }
  if (input.source !== 'coach' && targetIds.length === 0) {
    throw new Error(`${input.source} mission launches require exact target ids`)
  }

  return {
    launchId: input.launchId?.trim() || stableLaunchId({ ...input, targetIds }),
    missionId: mission.id,
    targetIds,
    source: input.source,
    ...(input.stepId ? { stepId: input.stepId } : {}),
  }
}

/**
 * Deterministic authored mission handoff for a canonical target.
 *
 * Misiones con guión (diálogo hablado): el pronunciation path, daily plan, sound lab
 * y tracking lanzan esto para practicar de forma hablada turno a turno con el coach.
 */
export function missionForTarget(targetId: string): ScriptedMission | null {
  if (!getTarget(targetId).ok) return null
  return listMissions().find((mission): mission is ScriptedMission =>
    isScriptedMission(mission) &&
    mission.targets.some((target) => target.targetId === targetId),
  ) ?? null
}

export function reconcileMissionLaunch(
  launch: MissionLaunch,
  outcome: MissionOutcome,
): { completed: boolean; stepId: string | null } {
  if (outcome.missionId !== launch.missionId || !outcome.goalAchieved) {
    return { completed: false, stepId: null }
  }
  const evidenced = new Set(
    outcome.targetEvidence
      .filter((entry) => entry.outcome !== 'unscored')
      .map((entry) => entry.targetId),
  )
  const completed = launch.targetIds.length === 0
    ? outcome.intelligibilityEvidence.scoredCount > 0
    : launch.targetIds.every((targetId) => evidenced.has(targetId))
  return { completed, stepId: completed && launch.source === 'daily' ? launch.stepId ?? null : null }
}
