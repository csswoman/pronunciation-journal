import { BASE_MODELS, QUALITY_FALLBACK_MODELS } from './fallback'

/** Shared deadlines: retain one fallback; tune with measured latency/success rates. */
export const TRANSCRIPTION_PROFILE = {
  models: BASE_MODELS,
  timeoutMs: 12_000,
  totalTimeoutMs: 25_000,
  maxAttempts: 2,
} as const

export const PRODUCTION_GRADING_PROFILE = {
  ...TRANSCRIPTION_PROFILE,
  models: QUALITY_FALLBACK_MODELS,
  thinking: 'low',
} as const
