import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'
import type { Sound } from '@/lib/phoneme-practice/types'
import { canonicalizeContrastId } from '@/lib/phoneme-practice/phoneme-similarity'
import {
  CANONICAL_SOUNDS,
  canonicalizeSoundIpa,
  getCanonicalSound,
} from './inventory'

export function canonicalizeSoundRows(rows: Sound[]): Sound[] {
  const byIpa = new Map<string, Sound>()
  for (const row of rows) {
    const normalized = canonicalizeSoundRow(row)
    if (!normalized) continue

    const { ipa } = normalized
    const existing = byIpa.get(ipa)
    const sourceIsCanonical = formatIpaDisplay(row.ipa) === ipa
    const existingIsCanonical = existing?.ipa === ipa && existing.id === row.id
    if (!existing || (sourceIsCanonical && !existingIsCanonical)) {
      byIpa.set(ipa, normalized)
    }
  }

  return CANONICAL_SOUNDS.flatMap((phoneme) => {
    const row = byIpa.get(phoneme.symbol)
    return row ? [row] : []
  })
}

/** Normalize one Supabase sound row while preserving its database id. */
export function canonicalizeSoundRow(row: Sound): Sound | null {
  const ipa = canonicalizeSoundIpa(row.ipa)
  const phoneme = getCanonicalSound(ipa)
  return phoneme ? { ...row, ipa, type: phoneme.type } : null
}

export function canonicalizeSoundFocus(soundFocus: string | null): string | null {
  return soundFocus && getCanonicalSound(soundFocus)
    ? canonicalizeSoundIpa(soundFocus)
    : soundFocus
}

export function canonicalizeSoundWord<T extends { sound_focus: string | null }>(word: T): T {
  const soundFocus = canonicalizeSoundFocus(word.sound_focus)
  return soundFocus === word.sound_focus ? word : { ...word, sound_focus: soundFocus }
}

export function canonicalizeProgressRows<T extends { contrast_id: string }>(rows: T[]): T[] {
  const byContrast = new Map<string, { row: T; isCanonical: boolean }>()
  for (const row of rows) {
    const contrastId = canonicalizeContrastId(row.contrast_id)
    const normalized = row.contrast_id === contrastId
      ? row
      : { ...row, contrast_id: contrastId }
    const existing = byContrast.get(contrastId)
    if (!existing || (row.contrast_id === contrastId && !existing.isCanonical)) {
      byContrast.set(contrastId, {
        row: normalized,
        isCanonical: row.contrast_id === contrastId,
      })
    }
  }
  return [...byContrast.values()].map(({ row }) => row)
}
