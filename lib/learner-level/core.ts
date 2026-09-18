import { normalizeCEFR, type CEFRLevel } from '@/lib/exercises/cefr'

export const LEARNER_LEVEL_SOURCES = [
  'placement', 'checkpoint', 'manual', 'practice_estimate', 'starter_default',
] as const

export type LearnerLevelSource = (typeof LEARNER_LEVEL_SOURCES)[number]

export interface LearnerLevelResolution {
  level: CEFRLevel
  source: LearnerLevelSource
  confidence: number | null
  isPlaced: boolean
  updatedAt: string | null
}

interface LearnerLevelInput {
  profileLevel?: string | null
  profileSource?: string | null
  profileUpdatedAt?: string | null
  practiceLevel?: string | null
  practiceConfidence?: number | null
}

const AUTHORITATIVE_SOURCES = new Set<LearnerLevelSource>(['placement', 'checkpoint', 'manual'])

function isLevelSource(value: string | null | undefined): value is LearnerLevelSource {
  return LEARNER_LEVEL_SOURCES.includes(value as LearnerLevelSource)
}

export function resolveLearnerLevel(input: LearnerLevelInput): LearnerLevelResolution {
  const source = isLevelSource(input.profileSource) ? input.profileSource : 'starter_default'
  const profileLevel = normalizeCEFR(input.profileLevel ?? 'A1')

  if (AUTHORITATIVE_SOURCES.has(source) || source === 'practice_estimate') {
    return {
      level: profileLevel,
      source,
      confidence: source === 'practice_estimate' ? (input.practiceConfidence ?? null) : null,
      isPlaced: source === 'placement' || source === 'checkpoint',
      updatedAt: input.profileUpdatedAt ?? null,
    }
  }

  const confidence = input.practiceConfidence ?? 0
  if (input.practiceLevel && confidence >= 0.6) {
    return {
      level: normalizeCEFR(input.practiceLevel),
      source: 'practice_estimate',
      confidence,
      isPlaced: false,
      updatedAt: input.profileUpdatedAt ?? null,
    }
  }

  return {
    level: profileLevel,
    source: 'starter_default',
    confidence: null,
    isPlaced: false,
    updatedAt: input.profileUpdatedAt ?? null,
  }
}
