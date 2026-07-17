import type { PracticeExercise } from '@/lib/practice/types'

/** IPA for the session shell — config first, then first phoneme exercise. */
export function resolveSessionIpa(
  soundIpa: string | undefined,
  exercises: PracticeExercise[],
): string | undefined {
  const fromConfig = soundIpa?.trim()
  if (fromConfig) return fromConfig

  for (const ex of exercises) {
    if (ex.payload.kind !== 'phoneme') continue
    const ipa = ex.payload.ipa?.trim()
    if (ipa) return ipa
  }

  return undefined
}

/** Normalise IPA for display (e.g. ŋ → /ŋ/). */
export function formatIpaDisplay(ipa: string): string {
  const trimmed = ipa.trim()
  if (!trimmed) return ipa
  if (trimmed.startsWith('/') && trimmed.endsWith('/')) return trimmed
  const bare = trimmed.replace(/^\/|\/$/g, '')
  return bare ? `/${bare}/` : trimmed
}
