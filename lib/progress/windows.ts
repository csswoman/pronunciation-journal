export function startOfRollingWindow(days: number, now: Date = new Date()): Date {
  const start = new Date(now)
  start.setDate(start.getDate() - days)
  return start
}

export function sumWeeklyExercises(rows: Array<{ exercises_total: number | null }>): number {
  return rows.reduce((total, row) => total + (row.exercises_total ?? 0), 0)
}
