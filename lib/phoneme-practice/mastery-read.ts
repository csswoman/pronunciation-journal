import { PHONEME_CONFUSION, contrastKey } from './phoneme-similarity'
import { canonicalizeSoundIpa } from '@/lib/sounds/inventory'
import { canonicalizeProgressRows } from '@/lib/sounds/normalization'
import { MASTERY_HALF_LIFE_DAYS, projectMasteryPct } from './mastery-pct'
import type { UserContrastProgress } from './types'

/** Strip leading/trailing slashes for display keys. */
export function normalizeIpaKey(ipa: string): string {
  return ipa.replace(/^\/+|\/+$/g, '')
}

/** Read-time decay of a stored mastery score, without writing anything back. */
export function liveMasteryPct(
  storedMastery: number,
  lastSeen: string | null,
  now: Date = new Date(),
): number {
  if (!Number.isFinite(storedMastery) || storedMastery <= 0 || !lastSeen) {
    return Number.isFinite(storedMastery) ? Math.min(100, Math.max(0, storedMastery)) : 0
  }
  const lastTime = new Date(lastSeen).getTime()
  if (Number.isNaN(lastTime)) {
    return Math.round(Math.min(100, Math.max(0, storedMastery)))
  }
  const nowTime = now.getTime()
  const daysSince = Number.isFinite(nowTime)
    ? Math.max(0, (nowTime - lastTime) / 86_400_000)
    : 0
  const decayFactor = Math.exp(-daysSince / MASTERY_HALF_LIFE_DAYS)
  return Math.round(Math.min(100, Math.max(0, storedMastery * decayFactor)))
}

/** Sound-level mastery uses the weakest related contrast. */
export function soundMasteryPct(
  ipa: string,
  allProgress: UserContrastProgress[],
  now: Date = new Date(),
): number {
  const canonicalIpa = canonicalizeSoundIpa(ipa)
  const progress = canonicalizeProgressRows(allProgress)
  const confusables = PHONEME_CONFUSION[canonicalIpa]
  const progressMap = new Map(progress.map((p) => [p.contrast_id, p]))

  function getRowLiveMastery(row: UserContrastProgress): number {
    if (row.raw_mastery != null && Number.isFinite(row.raw_mastery)) {
      const liveRaw = liveMasteryPct(
        row.raw_mastery,
        row.raw_mastery_updated_at ?? row.last_seen ?? null,
        now,
      )
      const sessionCount = row.mastery_session_count != null && Number.isFinite(row.mastery_session_count)
        ? Math.max(1, row.mastery_session_count)
        : Math.max(1, Math.ceil(row.total_attempts / 10))
      return projectMasteryPct(liveRaw, sessionCount)
    }
    return liveMasteryPct(row.mastery_pct ?? 0, row.last_seen ?? null, now)
  }

  if (confusables?.length) {
    const values: number[] = []
    for (const other of confusables) {
      const key = contrastKey(canonicalIpa, other)
      const row = progressMap.get(key)
      if (row && row.total_attempts > 0) values.push(getRowLiveMastery(row))
    }
    if (values.length > 0) return Math.round(Math.min(...values))
  }

  const related = progress.filter((p) => p.contrast_id.split('|').includes(canonicalIpa))
  if (related.length === 0) return 0
  return Math.round(Math.min(...related.map((p) => getRowLiveMastery(p))))
}

export interface SoundMasteryRow {
  ipa: string
  mastery: number
  totalAttempts: number
}

/** Rank sounds by lowest dynamic mastery (for Progress / home). */
export function rankWeakestSounds(
  progress: UserContrastProgress[],
  options?: { minAttempts?: number; limit?: number; now?: Date },
): SoundMasteryRow[] {
  const canonicalProgress = canonicalizeProgressRows(progress)
  const minAttempts = options?.minAttempts ?? 5
  const limit = options?.limit ?? 5
  const now = options?.now ?? new Date()
  const ipas = new Set<string>()
  for (const p of canonicalProgress) {
    for (const ipa of p.contrast_id.split('|')) ipas.add(ipa)
  }

  return [...ipas]
    .map((ipa) => {
      const related = canonicalProgress.filter((row) => row.contrast_id.split('|').includes(ipa))
      const totalAttempts = Math.max(0, ...related.map((r) => r.total_attempts))
      return {
        ipa: normalizeIpaKey(ipa),
        mastery: soundMasteryPct(ipa, canonicalProgress, now),
        totalAttempts,
      }
    })
    .filter((r) => r.totalAttempts >= minAttempts)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, limit)
}

/** Map IPA (with slashes, e.g. "/iː/") to mastery for Sound Lab cards. */
export function buildSoundMasteryMap(progress: UserContrastProgress[]): Map<string, number> {
  const canonicalProgress = canonicalizeProgressRows(progress)
  const map = new Map<string, number>()
  const ipas = new Set<string>()
  for (const p of canonicalProgress) {
    for (const ipa of p.contrast_id.split('|')) ipas.add(ipa)
  }
  for (const ipa of ipas) {
    const mastery = soundMasteryPct(ipa, canonicalProgress)
    if (mastery > 0) map.set(ipa, mastery)
  }
  return map
}
