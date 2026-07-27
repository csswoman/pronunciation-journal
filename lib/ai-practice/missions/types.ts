import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'

export type MissionCategory = 'interview' | 'service' | 'workplace' | 'social'

export interface OralMissionTarget {
  targetId: PronunciationTargetId
  phrase: string
}

export interface RequiredIntent {
  id: string
  label: string
}

export interface OralMission {
  id: string
  category: MissionCategory
  recommendedCefr: CEFRLevel
  context: string
  communicativeGoal: string
  role: { model: string; student: string }
  opening: string
  maxTurns: number
  requiredIntents: RequiredIntent[]
  targets: OralMissionTarget[]
  transferVariant: { context: string; opening: string }
  /** The existing roleplay behavior, kept authored and prompt-local. */
  roleInstructions: string
}

export type LegacyRoleplayScenario =
  | 'interview'
  | 'cafe'
  | 'airport'
  | 'doctor'
  | 'store'
  | 'code_review'
  | 'standup'
  | 'tech_design'

export interface MissionRegistryIssue {
  missionId: string
  code:
    | 'duplicate_id'
    | 'invalid_target'
    | 'invalid_target_count'
    | 'invalid_intent'
    | 'duplicate_intent'
    | 'invalid_cefr'
    | 'invalid_max_turns'
  detail: string
}
