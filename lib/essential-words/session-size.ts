const STORAGE_KEY = 'ej:essential-words:session-size'

export type SessionSizeId = 'short' | 'recommended' | 'long'

export const SESSION_SIZES = [
  { id: 'short' as const, label: 'Corta · 5', wordBudget: 5, newCardCeiling: 2 },
  { id: 'recommended' as const, label: 'Recomendada · 9', wordBudget: 9, newCardCeiling: 3 },
  { id: 'long' as const, label: 'Larga · 15', wordBudget: 15, newCardCeiling: 5 },
] as const

export function sessionSizeById(id: SessionSizeId) {
  const row = SESSION_SIZES.find((s) => s.id === id) ?? SESSION_SIZES[1]
  return { wordBudget: row.wordBudget, newCardCeiling: row.newCardCeiling }
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
