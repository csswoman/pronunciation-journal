import { contrastIdToTargetId, getTarget } from '@/lib/pronunciation/targets/registry'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'
import { prioritizeFeedbackTarget } from '@/lib/pronunciation/feedback/prioritize'
import type { FeedbackPriority } from '@/lib/pronunciation/feedback/types'
import type { OralMission } from './types'

export type MissionPhase = 'briefing' | 'active' | 'correction' | 'transfer' | 'result'
export type MissionStatus = 'in_progress' | 'completed' | 'cancelled' | 'provider_error'

export interface MissionState {
  missionId: string
  phase: MissionPhase
  turnCount: number
  intentsObserved: Set<string>
  pendingCorrection: FeedbackPriority | null
  correctionRetried: boolean
  transferAttempted: boolean
  spokenAttempts: SpokenAttempt[]
  status: MissionStatus
}

export type MissionEvent =
  | { type: 'intent_observed'; intentId: string }
  | { type: 'turn_spoken'; attempt: SpokenAttempt }
  | { type: 'turn_text' }
  | { type: 'retry_correction' }
  | { type: 'transfer_attempted'; attempt: SpokenAttempt }
  | { type: 'provider_error' }
  | { type: 'cancel' }
  | { type: 'resume'; from: MissionState }

export function createMissionState(missionId: string): MissionState {
  return {
    missionId,
    phase: 'briefing',
    turnCount: 0,
    intentsObserved: new Set<string>(),
    pendingCorrection: null,
    correctionRetried: false,
    transferAttempted: false,
    spokenAttempts: [],
    status: 'in_progress',
  }
}

function cloneState(state: MissionState): MissionState {
  return {
    ...state,
    intentsObserved: new Set(state.intentsObserved),
    spokenAttempts: [...state.spokenAttempts],
    pendingCorrection: state.pendingCorrection ? { ...state.pendingCorrection } : null,
  }
}

function completeAtResult(state: MissionState): MissionState {
  return { ...state, phase: 'result', status: 'completed' }
}

function advanceTurn(state: MissionState, mission: OralMission): MissionState {
  const next = { ...state, turnCount: state.turnCount + 1 }
  return next.turnCount >= mission.maxTurns ? completeAtResult(next) : next
}

function canonicalTargetForAttempt(attempt: SpokenAttempt): string | null {
  return [
    attempt.targetId,
    attempt.contrastId ? contrastIdToTargetId(attempt.contrastId) : undefined,
  ].find((candidate) => candidate && getTarget(candidate).ok) ?? null
}

function priorityForAttempt(attempt: SpokenAttempt, mission: OralMission): FeedbackPriority | null {
  if (attempt.outcome !== 'scored') return null

  const canonicalAttemptTarget = canonicalTargetForAttempt(attempt)
  const missionTarget = mission.targets.find((target) => target.targetId === canonicalAttemptTarget)
  if (!missionTarget) return null

  return prioritizeFeedbackTarget([{
    targetId: missionTarget.targetId,
    confidence: 1,
    relevance: 1,
  }])
}

/**
 * Pure mission transition function. Model messages never enter this reducer;
 * only validated events and scored-attempt metadata can change mission state.
 */
export function missionReducer(
  state: MissionState,
  event: MissionEvent,
  mission: OralMission,
): MissionState {
  if (state.missionId !== mission.id) return state

  if (event.type === 'resume') {
    if (event.from.missionId !== mission.id) return state
    return cloneState(event.from)
  }

  if (state.status !== 'in_progress') return state

  switch (event.type) {
    case 'intent_observed': {
      if (!mission.requiredIntents.some((intent) => intent.id === event.intentId)) {
        console.debug('Ignored unknown oral mission intent', {
          missionId: mission.id,
          intentId: event.intentId,
        })
        return state
      }
      if (state.intentsObserved.has(event.intentId)) return state
      const next = cloneState(state)
      next.intentsObserved.add(event.intentId)
      return next
    }

    case 'turn_text': {
      const next = advanceTurn(cloneState(state), mission)
      if (next.phase === 'briefing') next.phase = 'active'
      if (state.phase === 'transfer') {
        next.transferAttempted = true
        return completeAtResult(next)
      }
      return next
    }

    case 'turn_spoken': {
      const next = advanceTurn(cloneState(state), mission)
      next.spokenAttempts.push(event.attempt)
      if (next.phase === 'result') return next

      if (state.phase === 'briefing') next.phase = 'active'
      if (
        state.phase === 'active'
        && state.correctionRetried
        && event.attempt.outcome === 'scored'
        && state.pendingCorrection?.targetId === canonicalTargetForAttempt(event.attempt)
      ) {
        next.phase = 'transfer'
        return next
      }
      if (
        state.phase === 'active'
        && event.attempt.outcome === 'scored'
        && !state.pendingCorrection
        && !state.correctionRetried
      ) {
        const priority = priorityForAttempt(event.attempt, mission)
        if (priority) {
          next.pendingCorrection = priority
          next.phase = 'correction'
        }
      }
      return next
    }

    case 'retry_correction':
      if (state.phase !== 'correction' || state.correctionRetried) return state
      return { ...cloneState(state), phase: 'active', correctionRetried: true }

    case 'transfer_attempted': {
      const next = advanceTurn(cloneState(state), mission)
      next.spokenAttempts.push(event.attempt)
      next.transferAttempted = true
      return completeAtResult(next)
    }

    case 'provider_error':
      return { ...cloneState(state), status: 'provider_error' }

    case 'cancel':
      return { ...cloneState(state), status: 'cancelled' }
  }
}
