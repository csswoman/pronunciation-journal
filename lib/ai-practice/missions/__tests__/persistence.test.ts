// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import { persistPronunciationFeedbackEvidence } from '@/lib/pronunciation/feedback/persistence'
import { persistMissionSession } from '../persistence'
import { createMissionState, missionReducer } from '../state-machine'
import { deriveMissionOutcome } from '../outcome'
import { getMission } from '../registry'
import { parseMissionLaunch } from '../launch'

const mission = getMission('roleplay.cafe')!

vi.mock('@/lib/pronunciation/feedback/persistence', () => ({
  persistPronunciationFeedbackEvidence: vi.fn(async () => true),
}))

describe('persistMissionSession', { timeout: 15_000 }, () => {
  beforeEach(async () => {
    await db.open()
    await db.missionSessions.clear()
    await db.syncOutbox.clear()
    vi.mocked(persistPronunciationFeedbackEvidence).mockClear()
  })

  it('writes exactly one MissionSessionRecord per session', async () => {
    let state = createMissionState(mission.id)
    state = missionReducer(state, { type: 'intent_observed', intentId: 'placed_order' }, mission)
    const outcome = deriveMissionOutcome(state, mission)

    await persistMissionSession('user-1', mission, state, outcome)

    const rows = await db.missionSessions.where('userId').equals('user-1').toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].missionId).toBe('roleplay.cafe')
    expect(rows[0].targetIds).toEqual(mission.targets.map((target) => target.targetId))
  })

  it('a two-account run never lets account B see account A session', async () => {
    const state = createMissionState(mission.id)
    const outcome = deriveMissionOutcome(state, mission)

    await persistMissionSession('user-a', mission, state, outcome)

    const bRows = await db.missionSessions.where('userId').equals('user-b').toArray()
    expect(bRows).toHaveLength(0)
  })

  it('routes target evidence through the existing pronunciation-feedback handoff', async () => {
    const state = createMissionState(mission.id)
    const outcome = {
      missionId: mission.id,
      goalAchieved: true,
      intelligibilityEvidence: { attempts: [], scoredCount: 1 },
      targetEvidence: [{ targetId: mission.targets[0].targetId, outcome: 'needs_more_evidence' as const }],
      repairUsed: false,
      unscoredReasons: [],
    }

    await persistMissionSession('user-1', mission, state, outcome)

    expect(persistPronunciationFeedbackEvidence).toHaveBeenCalled()
  })

  it('upserts a resumed canonical launch instead of duplicating the session', async () => {
    const state = createMissionState(mission.id)
    const outcome = deriveMissionOutcome(state, mission)
    const launch = parseMissionLaunch({
      launchId: 'tracking-launch-1',
      missionId: mission.id,
      targetIds: [mission.targets[0].targetId],
      source: 'tracking',
    })
    await persistMissionSession('user-1', mission, state, outcome, launch)
    await persistMissionSession('user-1', mission, state, outcome, launch)
    expect(await db.missionSessions.where('userId').equals('user-1').count()).toBe(1)
  })

  it('writes one answer and one coherent activity summary for a scored attempt, even after retry', async () => {
    const launch = parseMissionLaunch({
      launchId: 'daily-launch-1',
      missionId: mission.id,
      targetIds: [mission.targets[0].targetId],
      source: 'daily',
      stepId: 'daily-mission-step',
    })
    const state = {
      ...createMissionState(mission.id),
      phase: 'result' as const,
      status: 'completed' as const,
      spokenAttempts: [{
        userId: 'user-1',
        targetText: 'A cup of coffee, please.',
        transcript: 'a cup of coffee please',
        evaluatorVersion: 'stt-v1',
        scoreKind: 'stt_intelligibility' as const,
        overallScore: 88,
        targetId: mission.targets[0].targetId,
        durationMs: 2_400,
        outcome: 'scored' as const,
      }],
    }
    const outcome = deriveMissionOutcome(state, mission)

    await persistMissionSession('user-1', mission, state, outcome, launch)
    await persistMissionSession('user-1', mission, state, outcome, launch)

    const entries = await db.syncOutbox.where('userId').equals('user-1').toArray()
    expect(entries.filter((entry) => entry.table === 'answer_history')).toHaveLength(1)
    expect(entries.filter((entry) => entry.table === 'activity_sessions')).toHaveLength(1)
    expect(entries.filter((entry) => entry.table === 'activity_sessions').map((entry) => entry.payload.id))
      .toEqual(expect.arrayContaining(['mission-activity:daily-launch-1']))
  })
})
