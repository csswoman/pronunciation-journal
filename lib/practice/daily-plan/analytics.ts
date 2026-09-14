import { db, type AnalyticsEventName } from '@/lib/db'
import type { DailyStep } from '@/lib/practice/types'

type DailyStepEventName = Extract<AnalyticsEventName,
  'daily_step_started' | 'daily_step_completed' | 'daily_step_exited'>

export interface DailyStepAnalyticsPayload extends Record<string, unknown> {
  stepId: string
  stepKind: DailyStep['kind']
  exerciseCount: number
  chunkIds: string[]
  completedExercises?: number
}

/** Describes activity only; it is never evidence of chunk mastery. */
export function dailyStepAnalyticsPayload(step: DailyStep, completedExercises?: number): DailyStepAnalyticsPayload {
  return {
    stepId: step.id,
    stepKind: step.kind,
    exerciseCount: step.exercises.length,
    chunkIds: step.chunks?.map((chunk) => chunk.id) ?? [],
    ...(completedExercises === undefined ? {} : { completedExercises }),
  }
}

export async function logDailyStepEvent(
  name: DailyStepEventName,
  step: DailyStep,
  userId?: string | null,
  completedExercises?: number,
): Promise<void> {
  if (!userId) return
  await db.analyticsEvents.add({
    userId,
    name,
    payload: dailyStepAnalyticsPayload(step, completedExercises),
    timestamp: new Date().toISOString(),
    synced: 0,
  })
}

export interface DailyPilotActivityReport {
  startedSteps: number
  completedSteps: number
  exitedBeforeCompletion: number
  startedChunkIntroductions: number
  startedChunkReviews: number
}

type AnalyticsEventLike = {
  name: string
  payload: Record<string, unknown>
}

function isDailyStepPayload(payload: Record<string, unknown>): payload is DailyStepAnalyticsPayload {
  return typeof payload.stepId === 'string'
    && typeof payload.stepKind === 'string'
    && typeof payload.exerciseCount === 'number'
    && Array.isArray(payload.chunkIds)
}

/** Aggregates recorded activity for pilot review; it makes no learning claim. */
export function summarizeDailyPilotActivity(events: readonly AnalyticsEventLike[]): DailyPilotActivityReport {
  const report: DailyPilotActivityReport = {
    startedSteps: 0,
    completedSteps: 0,
    exitedBeforeCompletion: 0,
    startedChunkIntroductions: 0,
    startedChunkReviews: 0,
  }
  for (const event of events) {
    if (!isDailyStepPayload(event.payload)) continue
    if (event.name === 'daily_step_started') {
      report.startedSteps += 1
      if (event.payload.stepKind === 'chunk_intro') report.startedChunkIntroductions += 1
      if (event.payload.stepKind === 'chunk_review') report.startedChunkReviews += 1
    }
    if (event.name === 'daily_step_completed') report.completedSteps += 1
    if (event.name === 'daily_step_exited'
      && (event.payload.completedExercises ?? 0) < event.payload.exerciseCount) {
      report.exitedBeforeCompletion += 1
    }
  }
  return report
}

/** Loads one bounded window of recorded activity for a pilot review. */
export async function loadDailyPilotActivity(
  userId: string,
  since: Date,
  until: Date = new Date(),
): Promise<DailyPilotActivityReport> {
  const events = await db.analyticsEvents
    .where('[userId+timestamp]')
    .between([userId, since.toISOString()], [userId, until.toISOString()], true, true)
    .toArray()
  return summarizeDailyPilotActivity(events)
}
