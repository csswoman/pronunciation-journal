import type { EssentialWord, CefrLevel } from './types'
import { MAX_CHUNKS } from './types'
import type { WordBankEntry } from '@/lib/word-bank/types'

function cefrToDifficulty(level: CefrLevel): number {
  if (level === 'C1') return 3
  if (level === 'B1' || level === 'B2') return 2
  return 1 // A1, A2
}

export function coreWordToWordBankEntry(w: EssentialWord): WordBankEntry {
  return {
    id: `core1k:${w.word.toLowerCase()}`,
    user_id: '',
    text: w.word,
    // The authored Core dataset owns these fields. Preserve them when the
    // entry is adapted for generic practice modes such as match_pairs.
    meaning: w.meaning ?? null,
    translation: w.translation ?? null,
    example: w.example_sentence,
    ipa: w.ipa_strong,
    difficulty: cefrToDifficulty(w.cefr_level),
    srs_status: 'new',
    status: 'ready',
    audio_url: null,
    audio_fetch_attempts: 0,
    context: null,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
    ease_factor: 2.5,
    error_reason: null,
    has_audio: null,
    image_prompt: null,
    interval_days: 0,
    last_reviewed_at: null,
    next_review_at: null,
    repetitions: 0,
    review_count: 0,
    source: 'core1k',
    source_ref: null,
    synonyms: null,
    is_favorite: false,
    familiarity_confidence: 0,
    familiarity_status: 'unknown',
    mastery_provenance: 'none',
    mastery_version: 1,
    objective_evidence_count: 0,
    verification_due_at: null,
  }
}

/**
 * From a list of EssentialWords, keep only words with ≥4 characters (excludes
 * function words like "the", "a", "is"), then return a slice of `count`
 * words rotated deterministically by `day`.
 */
export function filterAndRotate(words: EssentialWord[], day: number, count: number): EssentialWord[] {
  const eligible = words.filter(w => w.word.length >= 4)
  if (eligible.length === 0) return []
  const start = day % eligible.length
  const result: EssentialWord[] = []
  for (let i = 0; i < count && i < eligible.length; i++) {
    result.push(eligible[(start + i) % eligible.length])
  }
  return result
}

function chunkUrl(n: number): string {
  return `/essential-words/words-${String(n).padStart(3, '0')}.json`
}

async function loadChunk(n: number): Promise<EssentialWord[]> {
  const res = await fetch(chunkUrl(n))
  if (!res.ok) return []
  const payload = await res.json() as { entries?: EssentialWord[] } | EssentialWord[]
  return Array.isArray(payload) ? payload : (payload.entries ?? [])
}

/**
 * Fetches Core 1000 words for the given day offset, returning `count`
 * WordBankEntry items. Words shorter than 4 characters are excluded.
 * Selection rotates by `day` so different days surface different words.
 * Loads additional chunks if the first chunk doesn't yield enough eligible words.
 */
export async function fetchEssentialWordsForDay(day: number, count: number): Promise<WordBankEntry[]> {
  const collected: EssentialWord[] = []
  let chunkIndex = 1

  while (collected.filter(w => w.word.length >= 4).length < count && chunkIndex <= MAX_CHUNKS) {
    const words = await loadChunk(chunkIndex)
    if (words.length === 0) break
    collected.push(...words)
    chunkIndex++
  }

  return filterAndRotate(collected, day, count).map(coreWordToWordBankEntry)
}
