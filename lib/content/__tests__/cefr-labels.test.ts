import { describe, it, expect } from 'vitest'
import {
  CEFR_LEVEL_DESCRIPTIONS,
  CEFR_LEVEL_LABELS,
  cefrLevelOptions,
  cefrLevelWithName,
  cefrNameWithLevel,
} from '../cefr-labels'
import { CEFR_LEVELS } from '@/lib/essential-words/types'

describe('CEFR label tables', () => {
  it('names and describes every modelled level', () => {
    for (const level of CEFR_LEVELS) {
      expect(CEFR_LEVEL_LABELS[level]).toBeTruthy()
      expect(CEFR_LEVEL_DESCRIPTIONS[level]).toBeTruthy()
    }
  })

  it('never reuses one name for two levels', () => {
    const names = CEFR_LEVELS.map((level) => CEFR_LEVEL_LABELS[level])
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('label formatters', () => {
  it('joins code and name', () => {
    expect(cefrLevelWithName('B1')).toBe('B1 · Intermedio')
  })

  it('leads with the name when asked', () => {
    expect(cefrNameWithLevel('A1')).toBe('Principiante (A1)')
  })
})

describe('cefrLevelOptions', () => {
  it('returns the full range ordered easiest to hardest', () => {
    expect(cefrLevelOptions().map((o) => o.value)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1'])
  })

  it('caps the range at the given level', () => {
    expect(cefrLevelOptions('B2').map((o) => o.value)).toEqual(['A1', 'A2', 'B1', 'B2'])
  })

  it('carries the shared name and description', () => {
    const [a1] = cefrLevelOptions('A1')
    expect(a1.name).toBe(CEFR_LEVEL_LABELS.A1)
    expect(a1.description).toBe(CEFR_LEVEL_DESCRIPTIONS.A1)
  })
})
