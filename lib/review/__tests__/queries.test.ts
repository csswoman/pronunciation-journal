import { describe, expect, it } from 'vitest'
import { mergeReviewWords } from '@/lib/review/merge-words'
import { parseWordBankId } from '@/lib/review/parse-content-id'

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

describe('mergeReviewWords', () => {
  it('prioritizes weak over due on collision', () => {
    const weak = [{ id: 'a', label: 'weak' }]
    const due = [{ id: 'a', label: 'due' }, { id: 'b', label: 'due-b' }]
    const merged = mergeReviewWords(weak, due, 5)
    expect(merged).toHaveLength(2)
    expect(merged.find((w) => w.id === 'a')?.label).toBe('weak')
  })
})
