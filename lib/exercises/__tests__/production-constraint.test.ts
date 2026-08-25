import { describe, it, expect } from 'vitest'
import { generateSpokenProductionFromWordBank } from '@/lib/exercises/generators/production'
import type { WordBankEntry } from '@/lib/word-bank/types'

function entry(id: string, text: string): WordBankEntry {
  return {
    id,
    text,
    meaning: `significado de ${text}`,
    example: `This is a ${text} example sentence.`,
    ipa: null,
    difficulty: 3,
    source: 'word_bank',
    srs_status: 'review',
  } as unknown as WordBankEntry
}

describe('generateSpokenProductionFromWordBank with constraints', () => {
  it('attaches a constraint to every generated exercise', () => {
    const { exercises } = generateSpokenProductionFromWordBank(
      [entry('1', 'kitchen'), entry('2', 'travel')],
      2,
    )
    expect(exercises).toHaveLength(2)
    for (const ex of exercises) {
      expect(ex.constraint).toBeDefined()
      expect(ex.constraint!.id).toBeTruthy()
      expect(ex.constraint!.label).toBeTruthy()
    }
  })

  it('uses the constraint prompt instead of the generic one', () => {
    const { exercises } = generateSpokenProductionFromWordBank([entry('1', 'kitchen')], 1)
    const ex = exercises[0]!
    expect(ex.taskPrompt).toContain('kitchen')
    // The old generic prompts must be gone.
    expect(ex.taskPrompt).not.toBe('Di una oración usando "kitchen".')
  })

  it('varies constraints across a multi-exercise batch', () => {
    const entries = ['a', 'b', 'c', 'd'].map((t, i) => entry(String(i), t))
    const { exercises } = generateSpokenProductionFromWordBank(entries, 4)
    const ids = exercises.map((e) => e.constraint!.id)
    expect(new Set(ids).size).toBeGreaterThan(1)
  })

  it('generates as many exercises as requested when the pool allows', () => {
    const entries = Array.from({ length: 12 }, (_, i) => entry(String(i), `word${i}`))
    const { exercises } = generateSpokenProductionFromWordBank(entries, 12)
    expect(exercises).toHaveLength(12)
  })

  it('reaches the full count by repeating words with different constraints when the pool is small', () => {
    const entries = Array.from({ length: 6 }, (_, i) => entry(String(i), `word${i}`))
    const { exercises } = generateSpokenProductionFromWordBank(entries, 12)
    expect(exercises).toHaveLength(12)

    // No two exercises should be the exact same (word, constraint) pair.
    const ids = exercises.map((e) => e.id)
    expect(new Set(ids).size).toBe(exercises.length)

    // Every generated exercise still uses a word from the eligible pool.
    const validWords = new Set(entries.map((e) => e.text))
    for (const ex of exercises) {
      expect(validWords.has(ex.targetItem)).toBe(true)
    }
  })
})
