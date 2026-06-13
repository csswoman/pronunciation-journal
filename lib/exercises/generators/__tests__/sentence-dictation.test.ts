import { describe, it, expect } from 'vitest'
import { generateSentenceDictationFromWordBank } from '../sentence-dictation'
import type { WordBankEntry } from '@/lib/word-bank/types'

function makeEntry(overrides: Partial<WordBankEntry> = {}): WordBankEntry {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    text: 'ephemeral',
    meaning: 'lasting for a very short time',
    translation: null,
    ipa: null,
    example: 'The ephemeral beauty of cherry blossoms.',
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

describe('generateSentenceDictationFromWordBank', () => {
  it('discards entries without an example', () => {
    const entries = [
      makeEntry({ id: '1', text: 'ephemeral', example: 'The ephemeral beauty.' }),
      makeEntry({ id: '2', text: 'vivid', example: null }),
      makeEntry({ id: '3', text: 'stoic', example: null }),
    ]
    const results = generateSentenceDictationFromWordBank(entries, 10)
    expect(results).toHaveLength(1)
    expect(results[0].sentence).toBe('The ephemeral beauty.')
  })

  it('sets sentence to the entry example', () => {
    const entry = makeEntry({ id: '1', example: 'She spoke with great clarity.' })
    const results = generateSentenceDictationFromWordBank([entry], 1)
    expect(results[0].sentence).toBe('She spoke with great clarity.')
  })

  it('sets audioUrl from entry audio_url when present', () => {
    const entry = makeEntry({ id: '1', audio_url: 'https://example.com/audio.ogg' })
    const results = generateSentenceDictationFromWordBank([entry], 1)
    expect(results[0].audioUrl).toBe('https://example.com/audio.ogg')
  })

  it('sets audioUrl to null when entry has no audio', () => {
    const entry = makeEntry({ id: '1', audio_url: null })
    const results = generateSentenceDictationFromWordBank([entry], 1)
    expect(results[0].audioUrl).toBeNull()
  })

  it('respects the count parameter', () => {
    const entries = Array.from({ length: 8 }, (_, i) =>
      makeEntry({ id: String(i), example: `Sentence number ${i}.` })
    )
    expect(generateSentenceDictationFromWordBank(entries, 3)).toHaveLength(3)
    expect(generateSentenceDictationFromWordBank(entries, 6)).toHaveLength(6)
  })

  it('returns fewer than count when not enough usable entries', () => {
    const entries = [makeEntry({ id: '1', example: 'Only one entry.' })]
    const results = generateSentenceDictationFromWordBank(entries, 5)
    expect(results.length).toBeLessThanOrEqual(1)
  })

  it('sets sourceRef to word_bank with the entry id', () => {
    const entry = makeEntry({ id: 'abc-123' })
    const results = generateSentenceDictationFromWordBank([entry], 1)
    expect(results[0].sourceRef.source).toBe('word_bank')
    expect(results[0].sourceRef.id).toBe('abc-123')
  })

  it('sets type to sentence_dictation', () => {
    const entry = makeEntry({ id: '1' })
    const results = generateSentenceDictationFromWordBank([entry], 1)
    expect(results[0].type).toBe('sentence_dictation')
  })

  it('produces deterministic ids for the same entry', () => {
    const entry = makeEntry({ id: 'fixed-id', example: 'A fixed example sentence.' })
    const r1 = generateSentenceDictationFromWordBank([entry], 1)
    const r2 = generateSentenceDictationFromWordBank([entry], 1)
    expect(r1[0].id).toBe(r2[0].id)
  })

  it('populates targetWord and targetMeaning from entry', () => {
    const entry = makeEntry({
      id: 'entry-1',
      text: 'idyllic',
      meaning: 'pleasantly simple and peaceful',
      example: 'They lived in an idyllic village, far from the city noise.',
    })
    const exercises = generateSentenceDictationFromWordBank([entry], 1)
    expect(exercises).toHaveLength(1)
    expect(exercises[0].targetWord).toBe('idyllic')
    expect(exercises[0].targetMeaning).toBe('pleasantly simple and peaceful')
  })

  it('omits targetMeaning when entry has no meaning', () => {
    const entry = makeEntry({
      id: 'entry-2',
      text: 'vivid',
      meaning: null,
      example: 'The vivid colors of the sunset.',
    })
    const exercises = generateSentenceDictationFromWordBank([entry], 1)
    expect(exercises[0].targetWord).toBe('vivid')
    expect(exercises[0].targetMeaning).toBeUndefined()
  })
})
