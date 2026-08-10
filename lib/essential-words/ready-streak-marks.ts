import { addLocalDays, localDateKey } from './ready-date'

/** Last 7 local days ending today; true when that day had ≥1 EW attempt. */
export function buildStreakMarks(occurredAts: string[], now: Date): boolean[] {
  const end = new Date(now)
  end.setHours(12, 0, 0, 0)
  const active = new Set(occurredAts.map((iso) => localDateKey(new Date(iso))))
  return Array.from({ length: 7 }, (_, i) => {
    const day = addLocalDays(end, i - 6)
    return active.has(localDateKey(day))
  })
}
