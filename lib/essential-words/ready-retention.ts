import { addLocalDays } from './ready-date'

export const RETENTION_MIN_ATTEMPTS = 10

export interface RetentionAttempt {
  occurredAt: string
  correct: boolean
  eventType: string
}

export function computeRetention30d(
  attempts: RetentionAttempt[],
  now: Date,
  minAttempts = RETENTION_MIN_ATTEMPTS,
): { pct: number; sampleSize: number } | null {
  const from = addLocalDays(now, -30)
  const fromIso = from.toISOString()
  const toIso = now.toISOString()
  const inWindow = attempts.filter((a) => a.occurredAt >= fromIso && a.occurredAt <= toIso)

  const scheduled = inWindow.filter((a) => a.eventType === 'scheduled-review')
  const sample = scheduled.length >= minAttempts ? scheduled : inWindow
  if (sample.length < minAttempts) return null

  const correct = sample.filter((a) => a.correct).length
  return {
    pct: Math.round((correct / sample.length) * 100),
    sampleSize: sample.length,
  }
}
