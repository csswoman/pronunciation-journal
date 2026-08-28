import { describe, it, expect } from 'vitest'
import {
  SPEECH_CONSTRAINTS,
  selectConstraints,
  constraintById,
} from '@/lib/exercises/speech-constraints'

describe('SPEECH_CONSTRAINTS', () => {
  it('covers the tenses the learner avoids', () => {
    const ids = SPEECH_CONSTRAINTS.map((c) => c.id)
    expect(ids).toContain('past_simple_narrative')
    expect(ids).toContain('present_perfect_experience')
    expect(ids).toContain('future_plan')
    expect(ids).toContain('second_conditional')
    expect(ids).toContain('comparison')
    expect(ids).toContain('opinion_connector')
  })

  it('never offers a bare present-simple constraint', () => {
    // The whole point: the learner already defaults to present simple.
    const ids = SPEECH_CONSTRAINTS.map((c) => c.id)
    expect(ids).not.toContain('present_simple')
  })

  it('gives every constraint a Spanish prompt and an English check', () => {
    for (const c of SPEECH_CONSTRAINTS) {
      expect(c.promptEs('kitchen')).toContain('kitchen')
      expect(c.checkEn.length).toBeGreaterThan(10)
      expect(c.label.length).toBeGreaterThan(0)
    }
  })
})

describe('selectConstraints', () => {
  it('returns the requested count without repeating', () => {
    const picked = selectConstraints('seed-1', 5)
    expect(picked).toHaveLength(5)
    expect(new Set(picked.map((c) => c.id)).size).toBe(5)
  })

  it('is deterministic for the same seed', () => {
    expect(selectConstraints('seed-x', 4).map((c) => c.id))
      .toEqual(selectConstraints('seed-x', 4).map((c) => c.id))
  })

  it('differs across seeds', () => {
    const a = selectConstraints('seed-a', 3).map((c) => c.id).join()
    const b = selectConstraints('seed-b', 3).map((c) => c.id).join()
    expect(a).not.toBe(b)
  })

  it('caps at the catalogue size instead of repeating', () => {
    const picked = selectConstraints('seed', SPEECH_CONSTRAINTS.length + 10)
    expect(picked).toHaveLength(SPEECH_CONSTRAINTS.length)
  })

  it('can be restricted to a preferred subset', () => {
    const picked = selectConstraints('seed', 2, ['past_simple_narrative'])
    expect(picked[0]!.id).toBe('past_simple_narrative')
  })
})

describe('constraintById', () => {
  it('finds a known constraint', () => {
    expect(constraintById('past_simple_narrative')?.label).toBeTruthy()
  })

  it('returns null for an unknown id', () => {
    expect(constraintById('nope')).toBeNull()
  })
})
