import type { FocusPracticeDay, FocusPracticeProgress, FocusSprint } from './types'

export type FocusPracticeAction =
  | { kind: 'started' }
  | { kind: 'answered'; exerciseId: string }
  | { kind: 'completed' }

export function sprintTotalDays(sprint: FocusSprint): number {
  const days = Math.round((Date.parse(sprint.endsAt) - Date.parse(sprint.startsAt)) / 86_400_000)
  return Number.isFinite(days) ? Math.max(1, days) : 7
}

export function sprintDayAt(sprint: FocusSprint, now = new Date()): number | null {
  const elapsed = now.getTime() - Date.parse(sprint.startsAt)
  const totalDays = sprintTotalDays(sprint)
  if (!Number.isFinite(elapsed) || elapsed < 0 || now.getTime() > Date.parse(sprint.endsAt)) return null
  return Math.min(totalDays, Math.floor(elapsed / 86_400_000) + 1)
}

export function addFocusPractice(
  sprint: FocusSprint,
  contentId: string,
  action: FocusPracticeAction,
  now = new Date(),
): FocusPracticeProgress | null {
  const day = sprintDayAt(sprint, now)
  if (day === null || (action.kind === 'answered' && !action.exerciseId)) return null
  const days = sprint.practice?.days ?? []
  const previous = days.find((entry) => entry.day === day)
  const startedContentIds = new Set(previous?.startedContentIds ?? [])
  const answeredExerciseKeys = new Set(previous?.answeredExerciseKeys ?? [])
  const completedContentIds = new Set(previous?.completedContentIds ?? [])
  startedContentIds.add(contentId)
  if (action.kind === 'answered') answeredExerciseKeys.add(`${contentId}:${action.exerciseId}`)
  if (action.kind === 'completed') completedContentIds.add(contentId)
  const updated: FocusPracticeDay = {
    day,
    startedContentIds: [...startedContentIds],
    answeredExerciseKeys: [...answeredExerciseKeys],
    completedContentIds: [...completedContentIds],
    lastActivityAt: now.toISOString(),
  }
  return { days: [...days.filter((entry) => entry.day !== day), updated].sort((a, b) => a.day - b.day) }
}

export function practicedDays(progress?: FocusPracticeProgress): number {
  return progress?.days.filter((day) => day.answeredExerciseKeys.length > 0).length ?? 0
}
