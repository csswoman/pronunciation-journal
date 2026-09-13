import { describe, it, expect } from 'vitest'
import {
  generateSpokenProductionFromWordBank,
  generateWrittenProductionFromWordBank,
} from '../production'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { constraintsForLevel } from '@/lib/exercises/speech-constraints'

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
    expect(exercises[0].taskPrompt).toContain('achieve')
    expect(exercises[0].taskPrompt).not.toMatch(/Say|Speak|aloud/)
  })
})

describe('generateSpokenProductionFromWordBank level filtering', () => {
  const words = Array.from({ length: 4 }, (_, i) =>
    entry({ id: `wb-${i}`, text: `word${i}` }),
  )

  it('never hands an A1 learner a constraint above their level', () => {
    const { exercises } = generateSpokenProductionFromWordBank(words, 8, [], 'A1')
    const allowed = new Set(constraintsForLevel('A1').map((c) => c.id))

    expect(exercises.length).toBeGreaterThan(0)
    for (const ex of exercises) {
      expect(allowed.has(ex.constraint!.id)).toBe(true)
    }
  })

  it('ignores preferred constraints that are above the A1 learner', () => {
    const { exercises } = generateSpokenProductionFromWordBank(
      words,
      6,
      ['rodeo_circumlocution', 'spoken_verb_transform'],
      'A1',
    )
    expect(exercises.map((e) => e.constraint!.id)).not.toContain('rodeo_circumlocution')
  })

  it('gives a B2 learner the demanding constraints', () => {
    const { exercises } = generateSpokenProductionFromWordBank(
      words,
      4,
      ['rodeo_circumlocution'],
      'B2',
    )
    expect(exercises[0]?.constraint?.id).toBe('rodeo_circumlocution')
  })

  it('behaves as before when no level is given', () => {
    const without = generateSpokenProductionFromWordBank(words, 5)
    const explicitUndefined = generateSpokenProductionFromWordBank(words, 5, [], undefined)
    expect(without.exercises.map((e) => e.id)).toEqual(
      explicitUndefined.exercises.map((e) => e.id),
    )
  })
})
