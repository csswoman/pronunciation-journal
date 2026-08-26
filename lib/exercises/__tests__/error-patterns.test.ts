import { describe, it, expect } from 'vitest'
import {
  ERROR_PATTERNS,
  ERROR_PATTERN_IDS,
  isErrorPatternId,
  repairConstraintFor,
  describeErrorPattern,
} from '@/lib/exercises/error-patterns'
import { constraintById } from '@/lib/exercises/speech-constraints'

describe('ERROR_PATTERNS', () => {
  it("covers the learner's known failure modes", () => {
    expect(ERROR_PATTERN_IDS).toContain('tense_present_for_past')
    expect(ERROR_PATTERN_IDS).toContain('present_perfect_vs_past')
    expect(ERROR_PATTERN_IDS).toContain('missing_auxiliary')
    expect(ERROR_PATTERN_IDS).toContain('word_order')
    expect(ERROR_PATTERN_IDS).toContain('preposition_choice')
  })

  it('gives every pattern a Spanish description', () => {
    for (const id of ERROR_PATTERN_IDS) {
      expect(describeErrorPattern(id).length).toBeGreaterThan(5)
    }
  })

  it('points every repair constraint at a real constraint', () => {
    for (const pattern of ERROR_PATTERNS) {
      if (!pattern.repairConstraintId) continue
      expect(
        constraintById(pattern.repairConstraintId),
        `unknown constraint for ${pattern.id}`,
      ).not.toBeNull()
    }
  })
})

describe('isErrorPatternId', () => {
  it('accepts a known id', () => {
    expect(isErrorPatternId('tense_present_for_past')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isErrorPatternId('hallucinated_label')).toBe(false)
    expect(isErrorPatternId('')).toBe(false)
    expect(isErrorPatternId(null)).toBe(false)
    expect(isErrorPatternId(42)).toBe(false)
  })
})

describe('repairConstraintFor', () => {
  it('maps a past-tense error to the past narrative drill', () => {
    expect(repairConstraintFor('tense_present_for_past')).toBe('past_simple_narrative')
  })

  it('maps a present-perfect confusion to its drill', () => {
    expect(repairConstraintFor('present_perfect_vs_past')).toBe('present_perfect_experience')
  })

  it('returns null when no drill repairs the pattern', () => {
    expect(repairConstraintFor('spelling')).toBeNull()
  })
})
