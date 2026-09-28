/**
 * Exports the `minimal_pairs` Supabase table to
 * public/games/phoneme-invaders/pairs.json for Phoneme Invaders (offline,
 * no Supabase call during play). Re-run whenever minimal_pairs changes —
 * this is a snapshot, not a live query.
 *
 * Run with:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/export-minimal-pairs.ts
 *
 * Every row is validated by minimalPairsDataSchema BEFORE anything is
 * written — a malformed row aborts the export instead of shipping bad IPA.
 */
import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { canonicalizeSoundIpa } from '../lib/sounds/inventory'
import { contrastKey } from '../lib/phoneme-practice/phoneme-similarity'
import {
  minimalPairsDataSchema,
  type MinimalPairItem,
} from '../lib/games/phoneme-invaders/schema'

interface MinimalPairRow {
  id: number
  word_a: string
  word_b: string
  ipa_a: string | null
  ipa_b: string | null
  contrast_ipa_a: string | null
  contrast_ipa_b: string | null
}

const CURATED_PAIR_COUNT = 20
const CURATED_CONTRAST_COUNT = 6

async function fetchAllMinimalPairs(): Promise<MinimalPairRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(url, key)
  const rows: MinimalPairRow[] = []
  const pageSize = 500
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('minimal_pairs')
      .select('id, word_a, word_b, ipa_a, ipa_b, contrast_ipa_a, contrast_ipa_b')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1)
    if (error) throw new Error(`Failed to read minimal_pairs: ${error.message}`)
    const page = (data ?? []) as MinimalPairRow[]
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
}

/** Rows without both contrast IPAs can't drive the game's contrast grouping. */
function toGameItem(row: MinimalPairRow): MinimalPairItem | null {
  if (!row.ipa_a || !row.ipa_b || !row.contrast_ipa_a || !row.contrast_ipa_b) {
    return null
  }

  const contrast = contrastKey(
    canonicalizeSoundIpa(row.contrast_ipa_a),
    canonicalizeSoundIpa(row.contrast_ipa_b),
  )
  return {
    id: `pair-${row.id}`,
    wordA: row.word_a,
    wordB: row.word_b,
    ipaA: row.ipa_a,
    ipaB: row.ipa_b,
    contrast,
  }
}

async function exportMinimalPairs() {
  const targetPath = resolve(process.cwd(), 'public/games/phoneme-invaders/pairs.json')
  const rows = await fetchAllMinimalPairs()
  const candidates = rows
    .map(toGameItem)
    .filter((item): item is MinimalPairItem => item !== null)

  const validated = minimalPairsDataSchema.parse(candidates)
  const contrastCount = new Set(validated.map((pair) => pair.contrast)).size
  if (validated.length <= CURATED_PAIR_COUNT || contrastCount <= CURATED_CONTRAST_COUNT) {
    throw new Error(
      `Export contains ${validated.length} pairs across ${contrastCount} contrasts; ` +
        `preserving curated pairs.json because both counts must exceed ${CURATED_PAIR_COUNT} pairs and ${CURATED_CONTRAST_COUNT} contrasts`,
    )
  }

  writeFileSync(targetPath, JSON.stringify(validated, null, 2), 'utf-8')
  console.log(
    `Exported ${validated.length} minimal pairs across ${contrastCount} contrasts to ${targetPath}`,
  )
}

exportMinimalPairs().catch((err) => {
  console.error('Failed to export minimal pairs:', err)
  process.exit(1)
})
