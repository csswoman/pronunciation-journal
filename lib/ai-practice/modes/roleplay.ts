import type { compactState } from '@/lib/ai-practice/learning-state'
import { buildMissionPrompt } from '@/lib/ai-practice/missions/prompts'
import { getMissionForLegacyMode } from '@/lib/ai-practice/missions/registry'
import type { LegacyRoleplayScenario } from '@/lib/ai-practice/missions/types'

/** Compatibility type for persisted `roleplay:<scenario>` modes. */
export type RoleplayScenario = LegacyRoleplayScenario

/**
 * Compatibility adapter for old callers. New mission-aware code should call
 * buildMissionPrompt with a registry entry instead.
 */
export function buildRoleplayPrompt(
  scenario: RoleplayScenario,
  compact?: ReturnType<typeof compactState>,
): string {
  const mission = getMissionForLegacyMode(`roleplay:${scenario}`)
  if (!mission) throw new Error(`Unknown roleplay scenario: ${scenario}`)
  return buildMissionPrompt(mission, compact)
}
