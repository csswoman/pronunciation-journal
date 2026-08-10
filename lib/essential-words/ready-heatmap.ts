import { addLocalDays, localDateKey } from './ready-date'

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4

export interface HeatmapDay {
  dayKey: string
  count: number
  level: HeatmapLevel
}

function intensityLevel(count: number): HeatmapLevel {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 6) return 3
  return 4
}

/** Pure: 12 weeks of local days ending today (84 days). */
export function buildHeatmap12w(occurredAts: string[], now: Date): HeatmapDay[] {
  const end = new Date(now)
  end.setHours(12, 0, 0, 0)
  const start = addLocalDays(end, -83)
  const counts = new Map<string, number>()
  for (let i = 0; i < 84; i++) {
    counts.set(localDateKey(addLocalDays(start, i)), 0)
  }
  for (const iso of occurredAts) {
    const key = localDateKey(new Date(iso))
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from({ length: 84 }, (_, i) => {
    const dayKey = localDateKey(addLocalDays(start, i))
    const count = counts.get(dayKey) ?? 0
    return { dayKey, count, level: intensityLevel(count) }
  })
}
