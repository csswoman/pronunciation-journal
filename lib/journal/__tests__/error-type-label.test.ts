import { describe, expect, it } from 'vitest'
import { journalErrorTypeLabel } from '@/lib/journal/error-type-label'

describe('journalErrorTypeLabel', () => {
  it('maps known types to Spanish labels', () => {
    expect(journalErrorTypeLabel('tense')).toBe('Tiempo verbal')
    expect(journalErrorTypeLabel('word_order')).toBe('Orden de palabras')
  })

  it('humanizes unknown snake_case without inventing meaning', () => {
    expect(journalErrorTypeLabel('subject_verb')).toBe('Subject verb')
  })

  it('falls back when empty', () => {
    expect(journalErrorTypeLabel('   ')).toBe('Detalle')
  })
})
