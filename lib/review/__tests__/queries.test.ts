import { describe, expect, it } from 'vitest'
import {
  computeCanStartReview,
  exerciseTypeLabel,
  rowsToFailedItems,
} from '@/lib/review/failed-sentences-core'
import { parseWordBankId, humanizeSlug, connectedSpeechDeckTitle } from '@/lib/review/content-ref'
import { mergeReviewWords } from '@/lib/review/merge-words'

describe('parseWordBankId', () => {
  it('extracts id from prefixed content_id', () => {
    expect(parseWordBankId('word_bank:abc-123')).toBe('abc-123')
  })

  it('accepts bare uuid', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000'
    expect(parseWordBankId(id)).toBe(id)
  })

  it('returns null for opaque hashes', () => {
    expect(parseWordBankId('k9x2m1')).toBeNull()
  })
})

describe('connectedSpeechDeckTitle', () => {
  it('maps cs-assimilation to a readable deck name', () => {
    expect(connectedSpeechDeckTitle('cs-assimilation')).toBe('Assimilation')
  })
})

describe('rowsToFailedItems', () => {
  it('labels text_fragments deck slugs without raw content_id', () => {
    const items = rowsToFailedItems(
      [
        {
          content_id: 'text_fragments:cs-assimilation',
          answered_at: '2026-06-01T12:00:00Z',
          target_word: null,
          user_answer: null,
          exercise_types: { slug: 'sentence_dictation' },
        },
      ],
      5,
    )
    expect(items[0]?.label).toBe('Habla conectada · Assimilation')
    expect(items[0]?.typeLabel).toBe('Dictado')
    expect(items[0]?.drillable).toBe(true)
  })

  it('uses target_word when available', () => {
    const items = rowsToFailedItems(
      [
        {
          content_id: 'word_bank:550e8400-e29b-41d4-a716-446655440000',
          answered_at: '2026-06-01T12:00:00Z',
          target_word: 'although',
          user_answer: 'altough',
          exercise_types: { slug: 'fill_blank' },
        },
      ],
      5,
    )
    expect(items[0]?.label).toBe('although')
    expect(items[0]?.drillable).toBe(true)
  })
})

describe('computeCanStartReview', () => {
  it('is true when drillable failed sentences exist', () => {
    expect(
      computeCanStartReview({
        failedSentences: [
          {
            contentId: 'text_fragments:cs-assimilation',
            wordBankId: null,
            slug: 'sentence_dictation',
            label: humanizeSlug('cs-assimilation'),
            typeLabel: exerciseTypeLabel('sentence_dictation'),
            drillable: true,
            phrase: null,
            failedAt: '',
          },
        ],
        weakWords: [],
        dueWords: [],
        soundsDue: [],
      }),
    ).toBe(true)
  })

  it('is false when only non-drillable failed sentences exist', () => {
    expect(
      computeCanStartReview({
        failedSentences: [
          {
            contentId: 'opaque:hash',
            wordBankId: null,
            slug: 'sentence_dictation',
            label: 'unknown',
            typeLabel: exerciseTypeLabel('sentence_dictation'),
            drillable: false,
            phrase: null,
            failedAt: '',
          },
        ],
        weakWords: [],
        dueWords: [],
        soundsDue: [],
      }),
    ).toBe(false)
  })
})

describe('mergeReviewWords', () => {
  it('prioritizes weak over due on collision', () => {
    const weak = [{ id: 'a', label: 'weak' }]
    const due = [{ id: 'a', label: 'due' }, { id: 'b', label: 'due-b' }]
    const merged = mergeReviewWords(weak, due, 5)
    expect(merged).toHaveLength(2)
    expect(merged.find((w) => w.id === 'a')?.label).toBe('weak')
  })
})
