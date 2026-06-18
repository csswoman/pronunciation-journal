import type { DailyPlan } from '@/lib/practice/types'

/** Local calendar date key (client timezone). */
export function todayDateStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function dailyDoneKey(userId: string): string {
  return `daily-done:${userId}:${todayDateStr()}`
}

export function dailyPlanKey(userId: string): string {
  return `daily-plan:${userId}:${todayDateStr()}`
}

export function dailyResolvedKey(userId: string): string {
  return `daily-resolved:${userId}:${todayDateStr()}`
}

export function loadDoneIds(userId: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(dailyDoneKey(userId))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function saveDoneIds(userId: string, ids: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(dailyDoneKey(userId), JSON.stringify([...ids]))
  } catch {
    // quota — ignore
  }
}

export function loadResolvedIds(userId: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(dailyResolvedKey(userId))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function saveResolvedIds(userId: string, ids: Set<string>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(dailyResolvedKey(userId), JSON.stringify([...ids]))
  } catch {
    // quota — ignore
  }
}

/** Merge server + local resolved step ids for today. */
export function mergeResolvedIds(userId: string, extra: string[]): Set<string> {
  const merged = loadResolvedIds(userId)
  for (const id of extra) merged.add(id)
  if (extra.length > 0) saveResolvedIds(userId, merged)
  return merged
}

export function loadCachedDailyPlan(userId: string): DailyPlan | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(dailyPlanKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as DailyPlan
  } catch {
    return null
  }
}

export function saveCachedDailyPlan(userId: string, plan: DailyPlan): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(dailyPlanKey(userId), JSON.stringify(plan))
  } catch {
    // quota — ignore
  }
}
