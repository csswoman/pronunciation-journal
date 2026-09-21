import { normalizeCEFR, type CEFRLevel } from '@/lib/exercises/cefr'

// 'practice_estimate' kept only to read legacy rows; no active writer emits it.
export const LEARNER_LEVEL_SOURCES = [
  'placement', 'checkpoint', 'manual', 'practice_estimate', 'starter_default',
] as const

export type LearnerLevelSource = (typeof LEARNER_LEVEL_SOURCES)[number]
export type LearnerLevelReadState = LearnerLevelSource | 'unknown'

export interface LearnerLevelResolution {
  level: CEFRLevel
  source: LearnerLevelReadState
  confidence: number | null
  isPlaced: boolean
  updatedAt: string | null
}

export interface LearnerLevelInput {
  profileLevel?: string | null
  profileSource?: string | null
  profileUpdatedAt?: string | null
  readFailed?: boolean
}

const AUTHORITATIVE_SOURCES = new Set<LearnerLevelSource>(['placement', 'checkpoint', 'manual'])

function isLevelSource(value: string | null | undefined): value is LearnerLevelSource {
  return LEARNER_LEVEL_SOURCES.includes(value as LearnerLevelSource)
}

export function resolveLearnerLevel(input: LearnerLevelInput): LearnerLevelResolution {
  const source = isLevelSource(input.profileSource) ? input.profileSource : 'starter_default'
  const profileLevel = normalizeCEFR(input.profileLevel ?? 'A1')

  if (input.readFailed && !isLevelSource(input.profileSource)) {
    return {
      level: profileLevel,
      source: 'unknown',
      confidence: null,
      isPlaced: false,
      updatedAt: null,
    }
  }

  // 'practice_estimate' stays a recognized source only to read old rows, if
  // any exist — no active writer produces it anymore. See LEARNER_LEVEL_SOURCES.
  if (AUTHORITATIVE_SOURCES.has(source) || source === 'practice_estimate') {
    return {
      level: profileLevel,
      source,
      confidence: null,
      isPlaced: source === 'placement' || source === 'checkpoint',
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
