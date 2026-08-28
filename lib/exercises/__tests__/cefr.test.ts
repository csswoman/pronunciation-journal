import { describe, it, expect } from 'vitest'
import {
  normalizeCEFR,
  cefrToNumber,
  cefrDistance,
  isCefrAppropriate,
  filterByCefrLevel,
  type CEFRLevel,
} from '@/lib/exercises/cefr'

describe('cefr utilities', () => {
  it('normalizes numbers and lowercase strings correctly', () => {
    expect(normalizeCEFR(1)).toBe('A1')
    expect(normalizeCEFR(3)).toBe('B1')
    expect(normalizeCEFR('a2')).toBe('A2')
    expect(normalizeCEFR('c1')).toBe('C1')
    expect(normalizeCEFR('unknown')).toBe('B1')
  })

  it('calculates numerical order and distances', () => {
    expect(cefrToNumber('A1')).toBe(1)
    expect(cefrToNumber('B2')).toBe(4)
    expect(cefrDistance('A2', 'B1')).toBe(1)
    expect(cefrDistance('B2', 'A2')).toBe(-2)
  })

  it('determines if level is appropriate (i+1 default)', () => {
    expect(isCefrAppropriate('B1', 'B1')).toBe(true)
    expect(isCefrAppropriate('B1', 'B2')).toBe(true)
    expect(isCefrAppropriate('B1', 'A2')).toBe(true)
    expect(isCefrAppropriate('B1', 'C1')).toBe(false)
  })

  it('filters collection of items based on CEFR level', () => {
    const items: Array<{ id: string; level?: CEFRLevel }> = [
      { id: '1', level: 'A1' },
      { id: '2', level: 'B1' },
      { id: '3', level: 'B2' },
      { id: '4', level: 'C2' },
      { id: '5' }, // no level set
    ]
    const filtered = filterByCefrLevel(items, 'B1', 1)
    const ids = filtered.map((i) => i.id)
    expect(ids).toContain('2') // B1
    expect(ids).toContain('3') // B2
    expect(ids).toContain('5') // no level passes
    expect(ids).not.toContain('1') // A1 is dist 2
    expect(ids).not.toContain('4') // C2 is dist 3
  })
})
