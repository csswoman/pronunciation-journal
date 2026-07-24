import { describe, expect, it } from 'vitest'
import { writingHintMessage } from '@/lib/journal/writing-hints/hint-labels'

describe('writingHintMessage', () => {
  it('returns a Spanish message for irregular-past', () => {
    expect(writingHintMessage('irregular-past')).toBe(
      'Este verbo es irregular en pasado. Revisa la forma correcta.',
    )
  })

  it('returns a distinct message per rule', () => {
    const ruleIds = [
      'irregular-past',
      'missing-past-ed',
      'am-agree',
      'double-negative',
      'missing-third-person-s',
      'irregular-plural',
      'missing-apostrophe',
    ] as const
    const messages = new Set(ruleIds.map(writingHintMessage))
    expect(messages.size).toBe(ruleIds.length)
  })
})
