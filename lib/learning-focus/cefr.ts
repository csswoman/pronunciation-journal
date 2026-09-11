import type { FocusLevel } from './types'

const FOCUS_LEVELS = new Set<FocusLevel>(['a1', 'a2', 'b1', 'b2', 'c1'])

/**
 * Normalizes a stored CEFR string to a focus level. C2 (which this feature does
 * not model, since it has no C2-specific focus content) folds down to C1 — the
 * same degradation `readStoredCefrLevel` and the practice hub already apply.
 * Returning null here would read as "no level" and silently reset a C2 learner
 * to A1.
 */
export function toFocusLevel(raw: string | null | undefined): FocusLevel | null {
  if (!raw) return null
  const normalized = raw.trim().toLowerCase()
  if (normalized === 'c2') return 'c1'
  return FOCUS_LEVELS.has(normalized as FocusLevel) ? (normalized as FocusLevel) : null
}

export function toProfileCefr(level: FocusLevel): string {
  return level.toUpperCase()
}
