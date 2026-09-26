/**
 * Grammar Drill Profiles by CEFR Level (A1–C1)
 *
 * Defines grading tolerance, reveal limits, structure constraints,
 * and exercise modes per level according to Plan 043.
 */

export type DrillLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1'

export interface DrillProfile {
  level: DrillLevel
  maxTypos: number
  revealAfterAttempts: number
  alreadyCorrectRatio: number
  buildMode: 'reorder' | 'combine' | 'reorder_chunks'
  sentenceWords: [min: number, max: number]
  personalizationMode: 'frame' | 'open'
  hintVisibility: 'visible' | 'on_demand'
}

export const DRILL_PROFILES: Record<DrillLevel, DrillProfile> = {
  A1: {
    level: 'A1',
    maxTypos: 2,
    revealAfterAttempts: 1,
    alreadyCorrectRatio: 0,
    buildMode: 'reorder',
    sentenceWords: [4, 6],
    personalizationMode: 'frame',
    hintVisibility: 'visible',
  },
  A2: {
    level: 'A2',
    maxTypos: 2,
    revealAfterAttempts: 1,
    alreadyCorrectRatio: 0.2,
    buildMode: 'reorder',
    sentenceWords: [6, 9],
    personalizationMode: 'frame',
    hintVisibility: 'visible',
  },
  B1: {
    level: 'B1',
    maxTypos: 2,
    revealAfterAttempts: 2,
    alreadyCorrectRatio: 0.3,
    buildMode: 'combine',
    sentenceWords: [8, 15],
    personalizationMode: 'open',
    hintVisibility: 'visible',
  },
  B2: {
    level: 'B2',
    maxTypos: 1,
    revealAfterAttempts: 2,
    alreadyCorrectRatio: 0.4,
    buildMode: 'reorder_chunks',
    sentenceWords: [10, 20],
    personalizationMode: 'open',
    hintVisibility: 'on_demand',
  },
  C1: {
    level: 'C1',
    maxTypos: 1,
    revealAfterAttempts: 2,
    alreadyCorrectRatio: 0.5,
    buildMode: 'reorder_chunks',
    sentenceWords: [12, 25],
    personalizationMode: 'open',
    hintVisibility: 'on_demand',
  },
}

export function getDrillProfile(level?: string | null): DrillProfile | null {
  if (!level) return null
  const normalized = level.toUpperCase() as DrillLevel
  return DRILL_PROFILES[normalized] ?? null
}
