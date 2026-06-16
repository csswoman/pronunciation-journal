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

function exampleFor(text: string): string {
  return `The ${text} was very useful in class today.`
}

describe('generateFillBlankFromWordBank', () => {
  it('discards entries without an example', () => {
    const entries = [
      makeEntry({ id: '1', text: 'ephemeral', example: 'The ephemeral beauty of flowers.' }),
      makeEntry({ id: '2', text: 'vivid', example: null }),
      makeEntry({ id: '3', text: 'stoic', example: null }),
      makeEntry({ id: '4', text: 'lucid', example: 'A lucid explanation was given here today.' }),
    ]
    const { exercises } = generateFillBlankFromWordBank(entries, 10)
    const answers = exercises.map((r) => r.answer)
    expect(answers).not.toContain('vivid')
    expect(answers).not.toContain('stoic')
  })

  it('discards entries where word does not appear as a token in example', () => {
    const entries = [
      makeEntry({ id: '1', text: 'run', example: 'She went for a runner.' }),
      makeEntry({ id: '2', text: 'run', example: 'She went for a run yesterday.' }),
      makeEntry({ id: '3', text: 'walk', example: 'He likes to walk in the park.' }),
      makeEntry({ id: '4', text: 'swim', example: 'She can swim across the lake quickly.' }),
      makeEntry({ id: '5', text: 'jump', example: 'The high jump was impressive.' }),
      makeEntry({ id: '6', text: 'climb', example: 'They climb the steep hill every morning.' }),
      makeEntry({ id: '7', text: 'dance', example: 'We dance together at the community center.' }),
    ]
    const { exercises } = generateFillBlankFromWordBank(entries, 10)
    const answers = exercises.map((r) => r.answer)
    expect(answers).toContain('run')
    const runResult = exercises.find((r) => r.answer === 'run')!
    expect(runResult.sentence).toContain('___')
    expect(runResult.sentence).not.toContain(' run ')
  })

  it('generates fill-blank from inflected Core 1000 example sentences', () => {
    const entries = [
      makeEntry({
        id: 'core-work',
        text: 'work',
        source: 'core1k',
        example: 'She works at a hospital downtown.',
      }),
      makeEntry({ id: '2', text: 'walk', example: 'He likes to walk in the park.' }),
      makeEntry({ id: '3', text: 'swim', example: 'She can swim across the lake quickly.' }),
      makeEntry({ id: '4', text: 'jump', example: 'The high jump was impressive.' }),
    ]
    const { exercises } = generateFillBlankFromWordBank(entries, 4)
    const work = exercises.find((ex) => ex.answer === 'work')
    expect(work).toBeDefined()
    expect(work!.sentence).toBe('She ___ at a hospital downtown.')
    expect(work!.sourceRef.source).toBe('core1k')
  })

  it('replaces the target word with ___ in the sentence', () => {
    const entries = [
      makeEntry({ id: '1', text: 'ephemeral', example: 'The ephemeral beauty of flowers.' }),
      makeEntry({ id: '2', text: 'vivid', example: 'A vivid dream stayed with her today.' }),
      makeEntry({ id: '3', text: 'stoic', example: 'He remained stoic under pressure today.' }),
      makeEntry({ id: '4', text: 'lucid', example: 'The lucid explanation helped everyone today.' }),
    ]
    const { exercises } = generateFillBlankFromWordBank(entries, 4)
    for (const ex of exercises) {
      expect(ex.sentence).toContain('___')
      expect(ex.sentence).not.toMatch(new RegExp(`\\b${ex.answer}\\b`, 'i'))
    }
  })

  it('always includes the answer in options and has exactly 4 options', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ id: String(i), text: `word${i}`, example: exampleFor(`word${i}`) }),
    )
    const { exercises } = generateFillBlankFromWordBank(entries, 5)
    for (const ex of exercises) {
      expect(ex.options).toHaveLength(4)
      expect(ex.options).toContain(ex.answer)
    }
  })

  it('never duplicates the answer in options', () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ id: String(i), text: `word${i}`, example: exampleFor(`word${i}`) }),
    )
    const { exercises } = generateFillBlankFromWordBank(entries, 5)
    for (const ex of exercises) {
      const answerCount = ex.options.filter((o) => o === ex.answer).length
      expect(answerCount).toBe(1)
    }
  })

  it('respects the count parameter', () => {
    const entries = Array.from({ length: 8 }, (_, i) =>
      makeEntry({ id: String(i), text: `word${i}`, example: exampleFor(`word${i}`) }),
    )
    expect(generateFillBlankFromWordBank(entries, 3).exercises).toHaveLength(3)
    expect(generateFillBlankFromWordBank(entries, 6).exercises).toHaveLength(6)
  })

  it('returns fewer than count when not enough usable entries', () => {
    const entries = [
      makeEntry({ id: '1', text: 'only', example: 'The only word here today.' }),
    ]
    const { exercises } = generateFillBlankFromWordBank(entries, 5)
    expect(exercises.length).toBeLessThanOrEqual(1)
  })

  it('reports skipped entries when distractor pool is too small', () => {
    const entries = [
      makeEntry({ id: '1', text: 'walk', example: 'He likes to walk in the park.' }),
      makeEntry({ id: '2', text: 'swim', example: 'She can swim across the lake quickly.' }),
    ]
    const { exercises, skipped } = generateFillBlankFromWordBank(entries, 2)
    expect(exercises).toHaveLength(0)
    expect(skipped.length).toBeGreaterThan(0)
    expect(skipped[0].reasons).toContain('insufficient_distractor_pool')
  })

  it('sets sourceRef to word_bank with the entry id', () => {
    const entry = makeEntry({
      id: 'abc-123',
      text: 'serendipity',
      example: 'A serendipity moment changed her plans today.',
    })
    const pool = Array.from({ length: 5 }, (_, i) =>
      makeEntry({ id: `extra-${i}`, text: `extra${i}`, example: exampleFor(`extra${i}`) }),
    )
    const { exercises } = generateFillBlankFromWordBank([entry, ...pool], 1)
    const found = exercises.find((r) => r.answer === 'serendipity')
    if (found) {
      expect(found.sourceRef.source).toBe('word_bank')
      expect(found.sourceRef.id).toBe('abc-123')
    }
  })
})
