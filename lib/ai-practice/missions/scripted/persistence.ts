'use client'

import { db, type MissionSessionRecord } from '@/lib/db'
import type { ScriptSessionScore } from './scoring'
import type { ScriptedMission } from '../types'

export async function persistScriptedSession(
  userId: string,
  mission: ScriptedMission,
  sessionScore: ScriptSessionScore,
  startedAt: string,
  sessionId?: string,
): Promise<void> {
  const now = new Date().toISOString()
  const record: MissionSessionRecord = {
    id: sessionId ?? globalThis.crypto.randomUUID(),
    userId,
    missionId: mission.id,
    targetIds: mission.targets.map((t) => t.targetId),
    outcome: {
      score: sessionScore.score,
      scoredLines: sessionScore.scoredLines,
      correctPhonemes: sessionScore.correctPhonemes,
      totalPhonemes: sessionScore.totalPhonemes,
    },
    turnCount: mission.script.length,
    status: 'completed',
    startedAt,
    completedAt: now,
  }

  await db.missionSessions.put(record)
}

export async function getPreviousBestScore(
  userId: string,
  missionId: string,
): Promise<number | null> {
  const sessions = await db.missionSessions
    .where('userId')
    .equals(userId)
    .filter((s) => s.missionId === missionId && s.status === 'completed')
    .toArray()

  let best: number | null = null
  for (const session of sessions) {
    const outcome = session.outcome as { score?: number | null } | undefined
    if (typeof outcome?.score === 'number') {
      if (best === null || outcome.score > best) {
        best = outcome.score
      }
    }
  }

  return best
}
