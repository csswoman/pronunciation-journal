import type { FocusLevel } from './types'

const FOCUS_LEVELS = new Set<FocusLevel>(['a1', 'a2', 'b1', 'b2', 'c1'])

export function toFocusLevel(raw: string | null | undefined): FocusLevel | null {
  if (!raw) return null
  const normalized = raw.trim().toLowerCase() as FocusLevel
  return FOCUS_LEVELS.has(normalized) ? normalized : null
}

export function toProfileCefr(level: FocusLevel): string {
  return level.toUpperCase()
}
