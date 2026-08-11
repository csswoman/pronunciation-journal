'use client'

import { db, type MissionSessionRecord } from '@/lib/db'
import { buildPronunciationFeedback } from '@/lib/pronunciation/feedback/model'
import { persistPronunciationFeedbackEvidence } from '@/lib/pronunciation/feedback/persistence'
import type { MissionOutcome } from './outcome'
import type { MissionState } from './state-machine'
import type { OralMission } from './types'
import type { MissionLaunch } from './launch'
import { reconcileMissionLaunch } from './launch'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import { loadResolvedIds, saveResolvedIds } from '@/lib/daily/plan-storage'
import { savePracticeAnswer } from '@/lib/practice/queries'
import { buildSessionResult } from '@/lib/practice/session-result'
import { nonSrsAttribution } from '@/lib/practice/attribution'
import type { ExerciseResult } from '@/lib/practice/types'

/**
 * Persists one coherent mission session record. Individual SpokenAttempts
 * are persisted separately by the existing pronunciation-feedback flow; this
 * record snapshots the mission contract without duplicating that evidence.
 */
export async function persistMissionSession(
  userId: string,
  mission: OralMission,
  state: MissionState,
  outcome: MissionOutcome,
  launch?: MissionLaunch | null,
): Promise<void> {
  const now = new Date().toISOString()
  const record: MissionSessionRecord = {
    id: launch?.launchId ?? globalThis.crypto.randomUUID(),
    userId,
    missionId: mission.id,
    targetIds: launch?.targetIds.length ? launch.targetIds : mission.targets.map((target) => target.targetId),
    launchSource: launch?.source,
    sourceStepId: launch?.stepId,
    outcome: outcome as unknown as Record<string, unknown>,
    turnCount: state.turnCount,
    status: state.status,
    startedAt: now,
    completedAt: state.status === 'completed' ? now : null,
  }

  const existing = await db.missionSessions.get(record.id)
  if (existing?.completedAt) return

  const completedAt = new Date(now)
  const reconciliation = launch && state.status === 'completed'
    ? reconcileMissionLaunch(launch, outcome)
    : null
  const results: ExerciseResult[] = outcome.intelligibilityEvidence.attempts.flatMap((attempt, index) => {
    if (attempt.outcome !== 'scored') return []
    return [{
      attemptId: `${record.id}:spoken:${index}`,
      exerciseId: `${mission.id}:spoken:${index}`,
      slug: 'cs_shadow_phrase',
      exerciseTypeId: 23,
      isCorrect: attempt.overallScore >= 70,
      userAnswer: attempt.transcript,
      timeMs: attempt.durationMs,
      score: attempt.overallScore,
      contentId: attempt.targetId ?? `${mission.id}:turn:${index}`,
      context: 'ai_coach',
      exercisePayload: {
        missionId: mission.id,
        targetId: attempt.targetId,
        modality: 'stt_intelligibility',
        evaluatorVersion: attempt.evaluatorVersion,
      },
      attribution: nonSrsAttribution('no_target', 'Pronunciation target state is owned by the feedback evidence writer.'),
      completedAt,
    } satisfies ExerciseResult]
  })

  await Promise.all(results.map((result) => savePracticeAnswer(userId, result)))
  const sessionResult = buildSessionResult(results)
  await recordActivitySession(userId, {
    practiceContext: 'ai_coach',
    sessionResult,
    activitySessionId: `mission-activity:${record.id}`,
    allowEmptySession: true,
    explicitReconciledStepIds: reconciliation?.stepId ? [reconciliation.stepId] : [],
    metadata: { coachTool: 'oral_mission', dailyTargetId: launch?.stepId },
  })

  for (const evidence of outcome.targetEvidence) {
    if (evidence.outcome === 'unscored') continue

    const feedback = buildPronunciationFeedback({
      signal: {
        kind: 'stt_intelligibility',
        evaluatorVersion: 'mission-v1',
        confidence: 0.8,
        transcript: '',
        recognizedPercent: 0,
      },
      candidates: [{ targetId: evidence.targetId, confidence: 0.8 }],
    })
    await persistPronunciationFeedbackEvidence(userId, {
      ...feedback,
      outcome: evidence.outcome,
      priority: { targetId: evidence.targetId },
    }).catch(() => undefined)
  }

  await db.missionSessions.put(record)

  if (reconciliation?.stepId) {
      const resolved = loadResolvedIds(userId)
      resolved.add(reconciliation.stepId)
      saveResolvedIds(userId, resolved)
      window.dispatchEvent(new CustomEvent('daily-step-resolved', { detail: { stepId: reconciliation.stepId } }))
  }
}
