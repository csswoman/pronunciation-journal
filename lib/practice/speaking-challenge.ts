/**
 * Reto semanal de habla acumulativo (B13)
 *
 * "Esta semana: 5 minutos de habla total".
 * Agrega el tiempo invertido en práctica oral (grabaciones, misiones, repetición de fonemas, shadowing)
 * a lo largo de la semana actual.
 */

export interface WeeklySpeakingChallenge {
  targetSeconds: number
  completedSeconds: number
  targetMinutes: number
  completedMinutes: number
  progressRatio: number
  isCompleted: boolean
  remainingSeconds: number
  formattedTime: string
}

export interface OralPracticeSession {
  timestamp: string | number | Date
  durationSeconds: number
  type?: string
}

/**
 * Returns the timestamp for Monday 00:00:00 of the current week (local time).
 */
export function getStartOfCurrentWeek(now: Date = new Date()): Date {
  const d = new Date(now)
  const day = d.getDay() // 0 = Sun, 1 = Mon, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Calculates the user's weekly speaking challenge progress.
 */
export function calculateWeeklySpeakingProgress(
  sessions: readonly OralPracticeSession[],
  targetMinutes = 5,
  now: Date = new Date(),
): WeeklySpeakingChallenge {
  const targetSeconds = Math.max(1, targetMinutes * 60)
  const weekStart = getStartOfCurrentWeek(now).getTime()

  let totalSeconds = 0
  for (const session of sessions) {
    const sessionTime = new Date(session.timestamp).getTime()
    if (sessionTime >= weekStart && session.durationSeconds > 0) {
      totalSeconds += session.durationSeconds
    }
  }

  const completedSeconds = Math.round(totalSeconds)
  const completedMinutes = +(completedSeconds / 60).toFixed(1)
  const progressRatio = Math.min(1, +(completedSeconds / targetSeconds).toFixed(2))
  const isCompleted = completedSeconds >= targetSeconds
  const remainingSeconds = Math.max(0, targetSeconds - completedSeconds)

  const mins = Math.floor(completedSeconds / 60)
  const secs = completedSeconds % 60
  const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`

  return {
    targetSeconds,
    completedSeconds,
    targetMinutes,
    completedMinutes,
    progressRatio,
    isCompleted,
    remainingSeconds,
    formattedTime,
  }
}
