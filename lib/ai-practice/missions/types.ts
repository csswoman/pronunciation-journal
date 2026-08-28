import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'

export type MissionCategory = 'interview' | 'service' | 'workplace' | 'social'
export type MissionMode = 'conversational' | 'scripted'
export type ScriptOrigin = 'authored' | 'generated'

export interface OralMissionTarget {
  targetId: PronunciationTargetId
  phrase: string
}

export interface RequiredIntent {
  id: string
  label: string
}

/** Campos comunes a toda misión, con independencia del modo. */
export interface MissionBase {
  id: string
  category: MissionCategory
  recommendedCefr: CEFRLevel
  context: string
  communicativeGoal: string
  targets: OralMissionTarget[]
}

/** El roleplay libre que ya existía. Sin cambios de comportamiento. */
export interface ConversationalMission extends MissionBase {
  mode: 'conversational'
  role: { model: string; student: string }
  opening: string
  maxTurns: number
  requiredIntents: RequiredIntent[]
  transferVariant: { context: string; opening: string }
  /** The existing roleplay behavior, kept authored and prompt-local. */
  roleInstructions: string
}

/** Referencia a audio modelo pregenerado (catálogo autorado). */
export interface AuthoredAudioRef {
  /** Ruta relativa dentro del bucket de audio. */
  path: string
  durationMs?: number
}

export interface ScriptLine {
  id: string
  speaker: 'coach' | 'learner'
  text: string
  /** Ausente ⇒ se sintetiza con speechSynthesis. */
  modelAudio?: AuthoredAudioRef
  targetId?: PronunciationTargetId
}

export interface ScriptedMission extends MissionBase {
  mode: 'scripted'
  origin: ScriptOrigin
  script: ScriptLine[]
}

export type OralMission = ConversationalMission | ScriptedMission

export function isScriptedMission(mission: OralMission): mission is ScriptedMission {
  return mission.mode === 'scripted'
}

export function isConversationalMission(
  mission: OralMission,
): mission is ConversationalMission {
  return mission.mode === 'conversational'
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
    | 'invalid_script'
    | 'invalid_intent'
    | 'duplicate_intent'
    | 'invalid_cefr'
    | 'invalid_max_turns'
  detail: string
}

