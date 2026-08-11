export interface LastEssentialWordsSession {
  practiced: number
  correct: number
  durationMs: number
  completedAt: string
}

function storageKey(userId: string): string {
  return `ej:essential-words:last-session:${userId}`
}

export function saveLastEssentialWordsSession(
  userId: string,
  summary: LastEssentialWordsSession,
): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(storageKey(userId), JSON.stringify(summary))
}

export function loadLastEssentialWordsSession(
  userId: string,
): LastEssentialWordsSession | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(storageKey(userId))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<LastEssentialWordsSession>
    if (
      typeof parsed.practiced !== 'number'
      || typeof parsed.correct !== 'number'
      || typeof parsed.durationMs !== 'number'
      || typeof parsed.completedAt !== 'string'
    ) {
      return null
    }
    return {
      practiced: parsed.practiced,
      correct: parsed.correct,
      durationMs: parsed.durationMs,
      completedAt: parsed.completedAt,
    }
  } catch {
    return null
  }
}
