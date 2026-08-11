import { addLocalDays, localDateKey } from './ready-date'

const DAY_LABELS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] as const

export interface ForecastDay {
  dayKey: string
  label: string
  count: number
}

/** Pure: bucket due ISO timestamps into the next 7 local calendar days (today → +6). */
export function bucketDueForecast(dueAts: string[], now: Date): ForecastDay[] {
  const start = new Date(now)
  start.setHours(12, 0, 0, 0)
  const counts = new Map<string, number>()
  for (let i = 0; i < 7; i++) {
    counts.set(localDateKey(addLocalDays(start, i)), 0)
  }
  for (const iso of dueAts) {
    const key = localDateKey(new Date(iso))
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from({ length: 7 }, (_, i) => {
    const day = addLocalDays(start, i)
    const dayKey = localDateKey(day)
    return {
      dayKey,
      label: DAY_LABELS[day.getDay()],
      count: counts.get(dayKey) ?? 0,
    }
  })
}
