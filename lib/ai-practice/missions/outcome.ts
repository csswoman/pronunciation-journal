import { buildPronunciationFeedback } from '@/lib/pronunciation/feedback/model'
import type { FeedbackOutcome } from '@/lib/pronunciation/feedback/types'
import { contrastIdToTargetId, getTarget } from '@/lib/pronunciation/targets/registry'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import type { SpokenAttempt, SpokenAttemptOutcome } from '@/lib/pronunciation/spoken-attempt'
import type { OralMission } from './types'
import type { MissionState } from './state-machine'

export interface MissionOutcome {
  missionId: string
  goalAchieved: boolean
  intelligibilityEvidence: {
    attempts: SpokenAttempt[]
    scoredCount: number
  }
  targetEvidence: Array<{
    targetId: PronunciationTargetId
    outcome: FeedbackOutcome
  }>
  repairUsed: boolean
  unscoredReasons: SpokenAttemptOutcome[]
}

function canonicalMissionTarget(
  attempt: SpokenAttempt,
  mission: OralMission,
): PronunciationTargetId | null {
  const candidates = [
    attempt.targetId,
    attempt.contrastId ? contrastIdToTargetId(attempt.contrastId) : undefined,
  ]

  for (const candidate of candidates) {
    if (!candidate || !getTarget(candidate).ok) continue
    const target = mission.targets.find((missionTarget) => missionTarget.targetId === candidate)
    if (target) return target.targetId
  }
  return null
}

function normalizedScore(attempt: SpokenAttempt): number {
  return Math.min(100, Math.max(0, attempt.overallScore))
}

/**
 * Derives a stable, multi-dimensional result from reducer state. Goal
 * achievement is set membership only; transcript/score data cannot satisfy
 * an intent, and intent data cannot inflate oral evidence.
 */
export function deriveMissionOutcome(state: MissionState, mission: OralMission): MissionOutcome {
  const targetEvidence = new Map<string, { targetId: PronunciationTargetId; outcome: FeedbackOutcome }>()
  const previousByTarget = new Map<string, ReturnType<typeof buildPronunciationFeedback>>()
  const unscoredReasons: SpokenAttemptOutcome[] = []
  const seenUnscored = new Set<SpokenAttemptOutcome>()
  let scoredCount = 0

  for (const attempt of state.spokenAttempts) {
    if (attempt.outcome !== 'scored') {
      const interruptedTarget = canonicalMissionTarget(attempt, mission)
      if (interruptedTarget) previousByTarget.delete(interruptedTarget)
      else previousByTarget.clear()
      if (!seenUnscored.has(attempt.outcome)) {
        seenUnscored.add(attempt.outcome)
        unscoredReasons.push(attempt.outcome)
      }
      continue
    }

    scoredCount += 1
    const targetId = canonicalMissionTarget(attempt, mission)
    if (!targetId) continue

    const feedback = buildPronunciationFeedback({
      signal: {
        kind: 'stt_intelligibility',
        evaluatorVersion: attempt.evaluatorVersion,
        confidence: 1,
        transcript: attempt.transcript,
        recognizedPercent: normalizedScore(attempt),
      },
      candidates: [{ targetId, confidence: 1, relevance: 1 }],
      previous: previousByTarget.get(targetId),
    })
    previousByTarget.set(targetId, feedback)
    targetEvidence.set(targetId, { targetId, outcome: feedback.outcome })
  }

  return {
    missionId: mission.id,
    goalAchieved: mission.requiredIntents.every((intent) => state.intentsObserved.has(intent.id)),
    intelligibilityEvidence: {
      attempts: [...state.spokenAttempts],
      scoredCount,
    },
    targetEvidence: [...targetEvidence.values()],
    repairUsed: state.correctionRetried,
    unscoredReasons,
  }
}
