import { describe, it, expect } from 'vitest'
import { wordMatchesSound, biasWordsBySound } from '../sound-word-bridge'
import type { WordBankEntry } from '@/lib/word-bank/types'

function entry(overrides: Partial<WordBankEntry> & Pick<WordBankEntry, 'id'>): WordBankEntry {
  const { id, ...rest } = overrides
  return {
    user_id: 'user-1',
    text: 'word',
    context: null,
    meaning: null,
    translation: null,
    ipa: null,
    example: null,
    synonyms: null,
    image_prompt: null,
    audio_url: null,
    status: 'ready',
    difficulty: 0,
    error_reason: null,
    audio_fetch_attempts: 0,
    has_audio: null,
    ease_factor: 2.5,
    interval_days: 1,
    repetitions: 0,
    srs_status: 'new',
    next_review_at: null,
    last_reviewed_at: null,
    review_count: 0,
    source: null,
    source_ref: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...rest,
    id,
  } as WordBankEntry
}

describe('wordMatchesSound', () => {
  it('returns false when the word has no ipa', () => {
    expect(wordMatchesSound(entry({ id: '1', ipa: null }), '/ɪ/')).toBe(false)
  })

  it('matches when the word ipa contains the sound symbol (slashes stripped)', () => {
    expect(wordMatchesSound(entry({ id: '1', text: 'ship', ipa: 'ʃɪp' }), '/ɪ/')).toBe(true)
  })

  it('does not match when the sound symbol is absent', () => {
    expect(wordMatchesSound(entry({ id: '1', text: 'sheep', ipa: 'ʃiːp' }), '/ɪ/')).toBe(false)
  })

  it('returns false for an empty sound ipa', () => {
    expect(wordMatchesSound(entry({ id: '1', ipa: 'ʃɪp' }), '')).toBe(false)
  })
})

describe('biasWordsBySound', () => {
  const ship = entry({ id: 'ship', text: 'ship', ipa: 'ʃɪp' })
  const fish = entry({ id: 'fish', text: 'fish', ipa: 'fɪʃ' })
  const sheep = entry({ id: 'sheep', text: 'sheep', ipa: 'ʃiːp' })
  const tree = entry({ id: 'tree', text: 'tree', ipa: 'triː' })
  const dog = entry({ id: 'dog', text: 'dog', ipa: 'dɒɡ' })

  it('promotes matched words ahead of unmatched ones', () => {
    // limit 4, quota 2. matched=[ship,fish] both promoted; rest filled from unmatched.
    const result = biasWordsBySound([sheep, tree, ship, fish, dog], '/ɪ/', 4)
    expect(result).toHaveLength(4)
    expect(result.slice(0, 2).map((w) => w.id)).toEqual(['ship', 'fish'])
    expect(result.slice(2).every((w) => !['ship', 'fish'].includes(w.id))).toBe(true)
  })

  it('fills remaining slots from unmatched words in input order', () => {
    const result = biasWordsBySound([sheep, tree, ship, dog], '/ɪ/', 3)
    expect(result.map((w) => w.id)).toEqual(['ship', 'sheep', 'tree'])
  })

  it('returns the unchanged slice when no word matches', () => {
    const result = biasWordsBySound([sheep, tree, dog], '/ɪ/', 2)
    expect(result.map((w) => w.id)).toEqual(['sheep', 'tree'])
  })

  it('returns the unchanged slice when soundIpa is empty', () => {
    const result = biasWordsBySound([sheep, tree, ship], '', 2)
    expect(result.map((w) => w.id)).toEqual(['sheep', 'tree'])
  })

  it('returns all words when there are fewer than the limit', () => {
    const result = biasWordsBySound([ship, sheep], '/ɪ/', 5)
    expect(result.map((w) => w.id)).toEqual(['ship', 'sheep'])
  })

  it('appends leftover matched words after unmatched when quota leaves room', () => {
    // limit 5, quota 3 matched; 2 matched + others. All fit.
    const result = biasWordsBySound([sheep, ship, fish, tree], '/ɪ/', 5)
    expect(result.map((w) => w.id)).toEqual(['ship', 'fish', 'sheep', 'tree'])
  })
})
