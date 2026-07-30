export type SoundDuration = "short" | "long"

/**
 * Supabase stores duration as part of the lesson category/description.
 * Normalize it once so learner-facing surfaces do not render the raw English
 * value alongside the Spanish label.
 */
export function parseSoundDuration(value: string | null | undefined): SoundDuration | undefined {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return undefined
  if (/\blong\b/.test(normalized)) return "long"
  if (/\bshort\b/.test(normalized)) return "short"
  return undefined
}
