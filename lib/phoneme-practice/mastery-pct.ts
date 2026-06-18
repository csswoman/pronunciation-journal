import { PHONEME_CONFUSION, contrastKey } from './phoneme-similarity'
import type { UserContrastProgress } from './types'

/** Days until mastery decays to ~50% without practice. */
export const MASTERY_HALF_LIFE_DAYS = 14

export const MASTERY_DISPLAY_THRESHOLD = 85

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

/**
 * Sessions needed before mastery_pct can reach 100%.
 * Matches MIN_ATTEMPTS in mastery.ts — keep in sync.
 */
export const MASTERY_MIN_SESSIONS = 10

/**
 * EMA with temporal decay, scaled by repetition count.
 *
 * Repetition scaling: mastery grows gradually as sessions accumulate.
 * sqrt(n / MIN_SESSIONS) gives a concave curve so early sessions feel
 * meaningful but the score can't hit 85%+ without enough repetitions.
 *
 * Examples at 80% accuracy:
 *   session 1  → ~25%
 *   session 3  → ~44%
 *   session 5  → ~57%
 *   session 10 → ~80%
 */
export function computeNextMasteryPct(
  oldMastery: number,
  sessionAccuracy: number,
  lastSeen: string | null,
  totalSessionsAfter: number,
  now: Date = new Date(),
): number {
  const repScale = Math.sqrt(Math.min(totalSessionsAfter, MASTERY_MIN_SESSIONS) / MASTERY_MIN_SESSIONS)

  if (lastSeen == null && oldMastery <= 0) {
    return Math.round(Math.min(100, Math.max(0, sessionAccuracy * repScale)))
  }

  const last = lastSeen ? new Date(lastSeen) : now
  const daysSince = Math.max(0, (now.getTime() - last.getTime()) / 86_400_000)
  const decayFactor = Math.exp(-daysSince / MASTERY_HALF_LIFE_DAYS)
  const sessionWeight = 1 - decayFactor

  const ema = oldMastery * decayFactor + sessionAccuracy * sessionWeight
  return Math.round(Math.min(100, Math.max(0, ema * repScale)))
}

/** Strip leading/trailing slashes for display keys. */
export function normalizeIpaKey(ipa: string): string {
  return ipa.replace(/^\/+|\/+$/g, '')
}

/**
 * Sound-level mastery = minimum contrast mastery for configured confusions
 * (weakest link blocks the displayed score).
 */
export function soundMasteryPct(ipa: string, allProgress: UserContrastProgress[]): number {
  const confusables = PHONEME_CONFUSION[ipa]
  const progressMap = new Map(allProgress.map((p) => [p.contrast_id, p]))

  if (confusables?.length) {
    const values: number[] = []
    for (const other of confusables) {
      const key = contrastKey(ipa, other)
      const row = progressMap.get(key)
      if (row && row.total_attempts > 0) {
        values.push(row.mastery_pct ?? 0)
      }
    }
    if (values.length > 0) return Math.round(Math.min(...values))
  }

  const related = allProgress.filter((p) => p.contrast_id.split('|').includes(ipa))
  if (related.length === 0) return 0
  return Math.round(Math.min(...related.map((p) => p.mastery_pct ?? 0)))
}

export interface SoundMasteryRow {
  ipa: string
  mastery: number
  totalAttempts: number
}

/** Rank sounds by lowest dynamic mastery (for Progress / home). */
export function rankWeakestSounds(
  progress: UserContrastProgress[],
  options?: { minAttempts?: number; limit?: number },
): SoundMasteryRow[] {
  const minAttempts = options?.minAttempts ?? 5
  const limit = options?.limit ?? 5
  const ipas = new Set<string>()
  for (const p of progress) {
    for (const ipa of p.contrast_id.split('|')) ipas.add(ipa)
  }

  return [...ipas]
    .map((ipa) => {
      const related = progress.filter((row) => row.contrast_id.split('|').includes(ipa))
      const totalAttempts = Math.max(0, ...related.map((r) => r.total_attempts))
      return {
        ipa: normalizeIpaKey(ipa),
        mastery: soundMasteryPct(ipa, progress),
        totalAttempts,
      }
    })
    .filter((r) => r.totalAttempts >= minAttempts && r.mastery > 0)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, limit)
}

/** Map IPA (with slashes, e.g. "/iː/") → mastery 0–100 for Sound Lab cards. */
export function buildSoundMasteryMap(progress: UserContrastProgress[]): Map<string, number> {
  const map = new Map<string, number>()
  const ipas = new Set<string>()
  for (const p of progress) {
    for (const ipa of p.contrast_id.split('|')) ipas.add(ipa)
  }
  for (const ipa of ipas) {
    const mastery = soundMasteryPct(ipa, progress)
    if (mastery > 0) map.set(ipa, mastery)
  }
  return map
}
