import { BASE_TUTOR_PROMPT } from '@/lib/ai-practice/prompts'
import type { compactState } from '@/lib/ai-practice/learning-state'
import type { ConversationalMission } from './types'

export interface MissionPromptState {
  phase?: string
  intentsObserved?: readonly string[]
  correctionRetried?: boolean
  transferAttempted?: boolean
}

/**
 * Renders the authored mission contract into the system prompt. The model is
 * told when to report an intent, but the reducer remains the only authority
 * that decides whether that report counts as evidence.
 */
export function buildMissionPrompt(
  mission: ConversationalMission,
  compact?: ReturnType<typeof compactState>,
  state?: MissionPromptState,
): string {

  const intentLines = mission.requiredIntents
    .map((intent) => `- ${intent.id}: ${intent.label}`)
    .join('\n')

  const progressLines = state
    ? [
        state.phase ? `Current phase: ${state.phase}` : '',
        state.intentsObserved?.length ? `Already reported intents: ${state.intentsObserved.join(', ')}` : '',
        state.correctionRetried ? 'The guided correction retry has already been used.' : '',
        state.transferAttempted ? 'The transfer attempt has already been completed.' : '',
      ].filter(Boolean).join('\n')
    : ''

  const parts = [
    BASE_TUTOR_PROMPT,
    `--- ORAL MISSION: ${mission.id.toUpperCase()} ---`,
    `Context: ${mission.context}`,
    `Communicative goal: ${mission.communicativeGoal}`,
    `You are the ${mission.role.model}. The student is the ${mission.role.student}.`,
    `Start the mission with this opening line: ${mission.opening}`,
    mission.roleInstructions,
    `The mission has a maximum of ${mission.maxTurns} student turns. Ask one question at a time and keep the interaction natural.`,
    `When the student clearly provides one of the following pieces of information, call mission_intent_observed with the exact intentId. The reducer, not you, decides whether the report counts. Do not invent or report an intent that is not listed here:\n${intentLines}`,
    'A text response can continue the practice but is never oral evidence. Never claim phoneme accuracy, native accent, or acoustic stress/rhythm/intonation scoring.',
    progressLines ? `--- MISSION STATE ---\n${progressLines}` : '',
  ]

  if (compact) parts.push(`--- STUDENT PROFILE ---\n${compact}`)

  return parts.filter(Boolean).join('\n\n').trim()
}
