/** Temporal decay parameter (in days). exp(-days/14) has e^-1 at 14d; constant preserved for curve stability (plan 048). */
export const MASTERY_HALF_LIFE_DAYS = 14
export const MASTERY_DISPLAY_THRESHOLD = 85
export const MASTERY_MIN_SESSIONS = 10

type ScorableResult = { isCorrect: boolean; score?: number }

/** Session accuracy 0–100; uses speak_word score when present. */
export function sessionAccuracyPct(results: ScorableResult[]): number {
  if (results.length === 0) return 0
  let sum = 0
  for (const r of results) {
    sum += r.score != null ? r.score : r.isCorrect ? 100 : 0
  }
  return sum / results.length
}

/** Confidence scale factor based on cumulative sessions: sqrt(n / MIN_SESSIONS), clamped to 1.0. */
export function computeRepScale(totalSessions: number): number {
  if (!Number.isFinite(totalSessions) || totalSessions <= 0) return 0
  return Math.sqrt(Math.min(totalSessions, MASTERY_MIN_SESSIONS) / MASTERY_MIN_SESSIONS)
}

/**
 * Returns the number of prior Sound Lab sessions represented by a row.
 * Rows created before `mastery_session_count` existed use their old attempt
 * confidence once, while Essential Words-only rows start at zero.
 */
export function priorMasterySessionCount(current: {
  total_attempts: number
  mastery_session_count?: number | null
  raw_mastery?: number | null
  observation_count?: number | null
}): number {
  const hasValidCount = Number.isFinite(current.mastery_session_count)
  const isLegacy = !hasValidCount || (
    current.mastery_session_count === 0
    && current.raw_mastery == null
    && (current.observation_count ?? 0) === 0
    && current.total_attempts > 0
  )
  return isLegacy
    ? Math.max(0, current.total_attempts)
    : Math.max(0, current.mastery_session_count ?? 0)
}

/**
 * Pure EMA computation with temporal decay (unscaled, [0, 100]).
 *
 * Calculates the next raw estimate from previous raw EMA, elapsed time,
 * and latest session accuracy. Does NOT apply repetition scaling.
 */
export function computeNextRawEma(
  oldRawEma: number | null | undefined,
  sessionAccuracy: number,
  lastSeen: string | null,
  now: Date = new Date(),
): number {
  const cleanAccuracy = Number.isFinite(sessionAccuracy)
    ? Math.min(100, Math.max(0, sessionAccuracy))
    : 0

  if (oldRawEma == null || !Number.isFinite(oldRawEma) || !lastSeen) {
    return Math.round(cleanAccuracy)
  }

  const lastTime = new Date(lastSeen).getTime()
  if (Number.isNaN(lastTime)) {
    return Math.round(Math.min(100, Math.max(0, oldRawEma)))
  }

  const nowTime = now.getTime()
  const daysSince = Number.isFinite(nowTime)
    ? Math.max(0, (nowTime - lastTime) / 86_400_000)
    : 0
  const decayFactor = Math.exp(-daysSince / MASTERY_HALF_LIFE_DAYS)
  const sessionWeight = 1 - decayFactor

  const cleanOld = Math.min(100, Math.max(0, oldRawEma))
  const ema = cleanOld * decayFactor + cleanAccuracy * sessionWeight
  return Math.round(Math.min(100, Math.max(0, ema)))
}

/**
 * Projects a raw EMA (0..100) to presentation mastery % by applying repetition scale once.
 */
export function projectMasteryPct(rawEma: number, totalSessions: number): number {
  if (!Number.isFinite(rawEma) || rawEma <= 0) return 0
  const repScale = computeRepScale(totalSessions)
  return Math.round(Math.min(100, Math.max(0, rawEma * repScale)))
}

export interface NextMasteryState {
  rawMastery: number
  masteryPct: number
}

/**
 * Computes both the new raw EMA (persisted) and projected presentation mastery (UI).
 * Handles legacy rows where raw_mastery was not previously recorded.
 */
export function computeNextMasteryState(
  current: {
    mastery_pct?: number | null
    raw_mastery?: number | null
    last_seen?: string | null
    raw_mastery_updated_at?: string | null
    observation_count?: number | null
  },
  sessionAccuracy: number,
  totalSessionsAfter: number,
  now: Date = new Date(),
): NextMasteryState {
  const hasRawMastery = current.raw_mastery != null && Number.isFinite(current.raw_mastery)
  const hasOnlyEssentialWordHistory = !hasRawMastery
    && (current.observation_count ?? 0) > 0
    && (current.mastery_pct ?? 0) > 0
  const priorRaw = hasRawMastery
    ? current.raw_mastery
    : !hasOnlyEssentialWordHistory && current.mastery_pct != null && current.mastery_pct > 0
      ? current.mastery_pct
      : undefined

  // New rows use the dedicated Sound Lab clock. Legacy rows fall back to
  // `last_seen` because their historical provenance cannot be reconstructed.
  const rawClock = current.raw_mastery_updated_at ?? current.last_seen ?? null
  const rawMastery = computeNextRawEma(priorRaw, sessionAccuracy, rawClock, now)
  const masteryPct = projectMasteryPct(rawMastery, totalSessionsAfter)

  return { rawMastery, masteryPct }
}

/**
 * Backward compatibility helper for single-value updates.
 */
export function computeNextMasteryPct(
  oldMastery: number,
  sessionAccuracy: number,
  lastSeen: string | null,
  totalSessionsAfter: number,
  now: Date = new Date(),
  oldRawMastery?: number | null,
): number {
  const state = computeNextMasteryState(
    {
      mastery_pct: oldMastery,
      raw_mastery: oldRawMastery,
      raw_mastery_updated_at: oldRawMastery != null ? lastSeen : undefined,
      last_seen: lastSeen,
    },
    sessionAccuracy,
    totalSessionsAfter,
    now,
  )
  return state.masteryPct
}

export {
  buildSoundMasteryMap,
  liveMasteryPct,
  normalizeIpaKey,
  rankWeakestSounds,
  soundMasteryPct,
  type SoundMasteryRow,
} from './mastery-read'
