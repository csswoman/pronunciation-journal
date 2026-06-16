import type { WordBankEntry } from '@/lib/word-bank/types'
import { assessWordBankEntry } from '@/lib/exercises/eligibility'

let fixtureSeq = 0

function nextFixtureId(prefix = 'wb'): string {
  fixtureSeq += 1
  return `${prefix}-${fixtureSeq}`
}

/**
 * Example with the target word embedded; after blankLemma ≥2 content words remain
 * (e.g. "very", "useful", "class", "today") — passes fill_blank context rules.
 */
export function fillBlankExampleSentence(text: string): string {
  return `The ${text} was very useful in class today.`
}

/** ≥4 tokens — passes reorder_words MIN_REORDER_TOKENS. */
export function reorderExampleSentence(text = 'topic'): string {
  return `She studied the ${text} carefully during class yesterday.`
}

/** Minimal word_bank row for generator and eligibility tests. */
export function makeWordBankEntry(overrides: Partial<WordBankEntry> = {}): WordBankEntry {
  const id = overrides.id ?? nextFixtureId()
  return {
    id,
    user_id: 'user-1',
    text: overrides.text ?? 'ephemeral',
    meaning: overrides.meaning ?? 'a definition',
    translation: null,
    ipa: null,
    example: overrides.example ?? 'The ephemeral beauty of cherry blossoms.',
    synonyms: null,
    image_prompt: null,
    difficulty: 3,
    srs_status: 'new',
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review_at: null,
    last_reviewed_at: null,
    status: 'ready',
    error_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    has_audio: false,
    audio_url: null,
    context: null,
    audio_fetch_attempts: 0,
    review_count: 0,
    source: null,
    source_ref: null,
    ...overrides,
  }
}

/** Row guaranteed to pass assessWordBankEntry(..., 'fill_blank') in isolation. */
export function makeFillBlankEligibleEntry(
  text: string,
  overrides: Partial<WordBankEntry> = {},
): WordBankEntry {
  return makeWordBankEntry({
    text,
    example: overrides.example ?? fillBlankExampleSentence(text),
    ...overrides,
  })
}

/**
 * N unique entries that pass fill_blank individually and together as a distractor pool.
 */
export function makeFillBlankPool(count: number): WordBankEntry[] {
  return Array.from({ length: count }, (_, i) =>
    makeFillBlankEligibleEntry(`poolword${i}`, { id: `pool-${i}` }),
  )
}

/** Row with an example long enough for reorder_words. */
export function makeReorderEligibleEntry(overrides: Partial<WordBankEntry> = {}): WordBankEntry {
  const text = overrides.text ?? 'ephemeral'
  return makeWordBankEntry({
    text,
    example: overrides.example ?? reorderExampleSentence(text),
    ...overrides,
  })
}

/** Lexicon-style row with fill-blank-safe default example (daily plan tests). */
export function makeLexiconWordBankEntry(overrides: Partial<WordBankEntry> = {}): WordBankEntry {
  const id = overrides.id ?? nextFixtureId('lex')
  const text = overrides.text ?? `word-${id.slice(0, 4)}`
  return makeWordBankEntry({
    id,
    text,
    source: 'lexicon',
    difficulty: 2,
    interval_days: 1,
    example:
      overrides.example === undefined
        ? fillBlankExampleSentence(text)
        : overrides.example,
    ...overrides,
  })
}

/** Reset auto-ids between test files (optional). */
export function resetWordBankFixtureIds(): void {
  fixtureSeq = 0
}

/** @internal Test helper — assert factory output matches eligibility contract. */
export function assertFillBlankEligible(entry: WordBankEntry, pool?: WordBankEntry[]): void {
  const result = assessWordBankEntry(entry, 'fill_blank', pool ? { pool } : undefined)
  if (!result.eligible) {
    throw new Error(`Expected fill_blank eligible, got: ${result.reasons.join(', ')}`)
  }
}
