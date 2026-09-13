import { describe, it, expect } from 'vitest'
import {
  SPEECH_CONSTRAINTS,
  selectConstraints,
  constraintById,
  constraintsForLevel,
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

describe('constraintsForLevel', () => {
  it('gives A1 only constraints an A1 learner can actually produce', () => {
    const ids = constraintsForLevel('A1').map((c) => c.id)

    // Grammar an A1 syllabus has not introduced yet.
    expect(ids).not.toContain('second_conditional')
    expect(ids).not.toContain('present_perfect_experience')
    expect(ids).not.toContain('past_continuous_interrupted')
    // Discourse tasks that presuppose sustained multi-sentence speech.
    expect(ids).not.toContain('rodeo_circumlocution')
    expect(ids).not.toContain('past_chain_narrative')
    expect(ids).not.toContain('problem_explanation')
  })

  it('leaves A1 with a usable set rather than an empty one', () => {
    const a1 = constraintsForLevel('A1')
    expect(a1.length).toBeGreaterThanOrEqual(4)
    const ids = a1.map((c) => c.id)
    expect(ids).toContain('question_form')
    expect(ids).toContain('negative_experience')
  })

  it('widens the set as the level rises', () => {
    const a1 = constraintsForLevel('A1').length
    const a2 = constraintsForLevel('A2').length
    const b1 = constraintsForLevel('B1').length
    const b2 = constraintsForLevel('B2').length

    expect(a2).toBeGreaterThan(a1)
    expect(b1).toBeGreaterThan(a2)
    expect(b2).toBeGreaterThanOrEqual(b1)
  })

  it('gives B2 and above the full catalog', () => {
    expect(constraintsForLevel('B2')).toHaveLength(SPEECH_CONSTRAINTS.length)
    expect(constraintsForLevel('C1')).toHaveLength(SPEECH_CONSTRAINTS.length)
  })

  it('falls back to the full catalog when the level is unknown', () => {
    expect(constraintsForLevel(undefined)).toHaveLength(SPEECH_CONSTRAINTS.length)
  })

  it('tags every constraint with a minimum level', () => {
    for (const c of SPEECH_CONSTRAINTS) {
      expect(['A1', 'A2', 'B1', 'B2']).toContain(c.minLevel)
    }
  })
})

describe('selectConstraints with a level', () => {
  it('never returns an above-level constraint to an A1 learner', () => {
    const picked = selectConstraints('seed-a1', 12, [], 'A1')
    const allowed = new Set(constraintsForLevel('A1').map((c) => c.id))
    for (const c of picked) {
      expect(allowed.has(c.id)).toBe(true)
    }
  })

  it('drops a preferred constraint that is above the learner level', () => {
    // step-builders always prefers these two; both are above A1.
    const picked = selectConstraints('seed-a1', 6, ['rodeo_circumlocution', 'spoken_verb_transform'], 'A1')
    expect(picked.map((c) => c.id)).not.toContain('rodeo_circumlocution')
    expect(picked.length).toBeGreaterThan(0)
  })

  it('still honors preferred constraints that are at or below level', () => {
    const picked = selectConstraints('seed-b2', 6, ['rodeo_circumlocution'], 'B2')
    expect(picked[0]?.id).toBe('rodeo_circumlocution')
  })

  it('is unchanged from the old behaviour when no level is passed', () => {
    expect(selectConstraints('seed-x', 5).map((c) => c.id)).toEqual(
      selectConstraints('seed-x', 5, [], undefined).map((c) => c.id),
    )
  })
})
