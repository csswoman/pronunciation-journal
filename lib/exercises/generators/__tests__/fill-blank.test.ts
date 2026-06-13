import { describe, it, expect } from 'vitest'
import { generateFillBlankFromWordBank } from '../fill-blank'
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

describe('generateFillBlankFromWordBank', () => {
  it('discards entries without an example', () => {
    const entries = [
      makeEntry({ id: '1', text: 'ephemeral', example: 'The ephemeral beauty.' }),
      makeEntry({ id: '2', text: 'vivid', example: null }),
      makeEntry({ id: '3', text: 'stoic', example: null }),
      makeEntry({ id: '4', text: 'lucid', example: 'A lucid explanation was given.' }),
    ]
    const results = generateFillBlankFromWordBank(entries, 10)
    const answers = results.map(r => r.answer)
    expect(answers).not.toContain('vivid')
    expect(answers).not.toContain('stoic')
  })

  it('discards entries where word does not appear as a token in example', () => {
    const entries = [
      makeEntry({ id: '1', text: 'run', example: 'She went for a runner.' }),
      makeEntry({ id: '2', text: 'run', example: 'She went for a run yesterday.' }),
      makeEntry({ id: '3', text: 'walk', example: 'He likes to walk in the park.' }),
      makeEntry({ id: '4', text: 'swim', example: 'She can swim very fast.' }),
      makeEntry({ id: '5', text: 'jump', example: 'The jump was very high.' }),
    ]
    const results = generateFillBlankFromWordBank(entries, 10)
    // entry '1' is discarded (runner ≠ run), entry '2' is kept; pool has enough distractors
    const answers = results.map(r => r.answer)
    expect(answers).toContain('run')
    const runResult = results.find(r => r.answer === 'run')!
    expect(runResult.sentence).toContain('___')
    expect(runResult.sentence).not.toContain(' run ')
  })

  it('replaces the target word with ___ in the sentence', () => {
    const entries = [
      makeEntry({ id: '1', text: 'ephemeral', example: 'The ephemeral beauty of flowers.' }),
      makeEntry({ id: '2', text: 'vivid', example: 'A vivid dream stayed with her.' }),
      makeEntry({ id: '3', text: 'stoic', example: 'He remained stoic under pressure.' }),
      makeEntry({ id: '4', text: 'lucid', example: 'The lucid explanation helped.' }),
    ]
    const results = generateFillBlankFromWordBank(entries, 4)
    for (const ex of results) {
      expect(ex.sentence).toContain('___')
      expect(ex.sentence).not.toMatch(new RegExp(`\\b${ex.answer}\\b`, 'i'))
    }
  })

  it('always includes the answer in options and has exactly 4 options', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ id: String(i), text: `word${i}`, example: `A word${i} in a sentence.` })
    )
    const results = generateFillBlankFromWordBank(entries, 5)
    for (const ex of results) {
      expect(ex.options).toHaveLength(4)
      expect(ex.options).toContain(ex.answer)
    }
  })

  it('never duplicates the answer in options', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ id: String(i), text: `word${i}`, example: `A word${i} in a sentence.` })
    )
    const results = generateFillBlankFromWordBank(entries, 5)
    for (const ex of results) {
      const answerCount = ex.options.filter(o => o === ex.answer).length
      expect(answerCount).toBe(1)
    }
  })

  it('respects the count parameter', () => {
    const entries = Array.from({ length: 8 }, (_, i) =>
      makeEntry({ id: String(i), text: `word${i}`, example: `The word${i} was useful.` })
    )
    expect(generateFillBlankFromWordBank(entries, 3)).toHaveLength(3)
    expect(generateFillBlankFromWordBank(entries, 6)).toHaveLength(6)
  })

  it('returns fewer than count when not enough usable entries', () => {
    const entries = [
      makeEntry({ id: '1', text: 'only', example: 'The only word here.' }),
    ]
    const results = generateFillBlankFromWordBank(entries, 5)
    expect(results.length).toBeLessThanOrEqual(1)
  })

  it('sets sourceRef to word_bank with the entry id', () => {
    const entry = makeEntry({ id: 'abc-123', text: 'serendipity', example: 'A serendipity moment.' })
    const pool = Array.from({ length: 5 }, (_, i) =>
      makeEntry({ id: `extra-${i}`, text: `extra${i}`, example: `The extra${i} is here.` })
    )
    const results = generateFillBlankFromWordBank([entry, ...pool], 1)
    const found = results.find(r => r.answer === 'serendipity')
    if (found) {
      expect(found.sourceRef.source).toBe('word_bank')
      expect(found.sourceRef.id).toBe('abc-123')
    }
  })
})
