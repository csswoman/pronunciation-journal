'use client'

import { db, type MissionSessionRecord } from '@/lib/db'
import type { MissionOutcome } from './outcome'
import type { MissionState } from './state-machine'
import type { OralMission } from './types'

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
): Promise<void> {
  const now = new Date().toISOString()
  const record: MissionSessionRecord = {
    id: globalThis.crypto.randomUUID(),
    userId,
    missionId: mission.id,
    targetIds: mission.targets.map((target) => target.targetId),
    outcome: outcome as unknown as Record<string, unknown>,
    turnCount: state.turnCount,
    status: state.status,
    startedAt: now,
    completedAt: state.status === 'completed' ? now : null,
  }

  await db.missionSessions.put(record)
}
