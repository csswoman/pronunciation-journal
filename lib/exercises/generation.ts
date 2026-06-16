import type { EligibilityReason } from '@/lib/exercises/eligibility'

export interface SkippedEntry {
  entryId: string
  text?: string
  reasons: EligibilityReason[]
}

export interface GenerationResult<T> {
  exercises: T[]
  skipped: SkippedEntry[]
}

export function emptyGenerationResult<T>(): GenerationResult<T> {
  return { exercises: [], skipped: [] }
}
