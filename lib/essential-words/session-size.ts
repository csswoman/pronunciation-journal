const STORAGE_KEY = 'ej:essential-words:session-size'

export type SessionSizeId = 'short' | 'recommended' | 'long'

export const SESSION_SIZES = [
  { id: 'short' as const, label: 'Corta · 5', actionBudget: 5, maxNewWords: 1 },
  { id: 'recommended' as const, label: 'Recomendada · 15', actionBudget: 15, maxNewWords: 3 },
  { id: 'long' as const, label: 'Larga · 25', actionBudget: 25, maxNewWords: 5 },
] as const

export function sessionSizeById(id: SessionSizeId) {
  const row = SESSION_SIZES.find((s) => s.id === id) ?? SESSION_SIZES[1]
  return { actionBudget: row.actionBudget, maxNewWords: row.maxNewWords }
}

export function readSessionSizePreference(): SessionSizeId {
  if (typeof localStorage === 'undefined') return 'recommended'
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'short' || raw === 'recommended' || raw === 'long') return raw
  return 'recommended'
}

export function writeSessionSizePreference(id: SessionSizeId): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, id)
}
