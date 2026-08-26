import { describe, it, expect } from 'vitest'
import {
  createEmptyState,
  applyProductionGrade,
} from '@/lib/ai-practice/learning-state'
import { duePatterns } from '@/lib/practice/error-recurrence'

const T0 = new Date('2026-08-24T10:00:00.000Z').getTime()
const DAY = 86_400_000

describe('createEmptyState', () => {
  it('starts with an empty recurrence queue', () => {
    expect(createEmptyState('u1', 'd1').errorRecurrence).toEqual({ entries: [] })
  })
})

describe('applyProductionGrade', () => {
  it('queues the pattern when the learner fails', () => {
    const state = applyProductionGrade(
      createEmptyState('u1', 'd1'),
      { correct: false, errorPattern: 'tense_present_for_past' },
      T0,
    )
    expect(state.errorRecurrence.entries).toHaveLength(1)
    expect(duePatterns(state.errorRecurrence, T0 + 2 * DAY)).toEqual(['tense_present_for_past'])
  })

  it('does nothing when there is no pattern', () => {
    const state = applyProductionGrade(
      createEmptyState('u1', 'd1'),
      { correct: false },
      T0,
    )
    expect(state.errorRecurrence.entries).toEqual([])
  })

  it('advances a queued pattern when the learner gets it right', () => {
    let state = applyProductionGrade(
      createEmptyState('u1', 'd1'),
      { correct: false, errorPattern: 'word_order' },
      T0,
    )
    state = applyProductionGrade(
      state,
      { correct: true, rehearsedPattern: 'word_order' },
      T0 + DAY,
    )
    expect(state.errorRecurrence.entries[0]!.stage).toBe(1)
  })

  it('tolerates state saved before this field existed', () => {
    const legacy = { ...createEmptyState('u1', 'd1') }
    delete (legacy as { errorRecurrence?: unknown }).errorRecurrence
    const state = applyProductionGrade(
      legacy as ReturnType<typeof createEmptyState>,
      { correct: false, errorPattern: 'spelling' },
      T0,
    )
    expect(state.errorRecurrence.entries).toHaveLength(1)
  })
})
