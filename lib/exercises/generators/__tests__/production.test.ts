import { describe, it, expect } from 'vitest'
import {
  generateSpokenProductionFromWordBank,
  generateWrittenProductionFromWordBank,
} from '../production'
import type { WordBankEntry } from '@/lib/word-bank/types'

function entry(overrides: Partial<WordBankEntry> = {}): WordBankEntry {
  return {
    id: 'wb-1',
    user_id: 'user-1',
    text: 'achieve',
    meaning: 'to succeed in doing something',
    translation: 'lograr',
    ipa: '/əˈtʃiːv/',
    example: 'She worked hard to achieve her goals.',
    source: 'manual',
    status: 'ready',
    srs_status: 'learning',
    created_at: '',
    updated_at: '',
    ...overrides,
  } as WordBankEntry
}

describe('generateWrittenProductionFromWordBank', () => {
  it('creates exercises with task prompt and target item', () => {
    const { exercises } = generateWrittenProductionFromWordBank([entry()], 1)
    expect(exercises).toHaveLength(1)
    expect(exercises[0].type).toBe('written_production')
    expect(exercises[0].targetItem).toBe('achieve')
    expect(exercises[0].taskPrompt).toContain('achieve')
    expect(exercises[0].sourceRef.source).toBe('word_bank')
  })

  it('skips entries without text', () => {
    const { exercises, skipped } = generateWrittenProductionFromWordBank(
      [entry({ text: '' })],
      1,
    )
    expect(exercises).toHaveLength(0)
    expect(skipped).toHaveLength(0)
  })

  it('produces deterministic prompts for the same entry', () => {
    const a = generateWrittenProductionFromWordBank([entry()], 1).exercises[0]
    const b = generateWrittenProductionFromWordBank([entry()], 1).exercises[0]
    expect(a.taskPrompt).toBe(b.taskPrompt)
    expect(a.id).toBe(b.id)
  })
})

describe('generateSpokenProductionFromWordBank', () => {
  it('creates spoken production exercises', () => {
    const { exercises } = generateSpokenProductionFromWordBank([entry()], 1)
    expect(exercises).toHaveLength(1)
    expect(exercises[0].type).toBe('spoken_production')
    expect(exercises[0].taskPrompt.toLowerCase()).toMatch(/say|speak|aloud/)
  })
})
