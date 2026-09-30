import { describe, it, expect } from 'vitest'
import {
  comboMultiplier,
  createInitialScoringState,
  applyHit,
  applyMiss,
} from '../scoring'

describe('scoring helper', () => {
  it('calculates combo multiplier based on streak thresholds (1x -> 2x at 5 -> 3x at 10)', () => {
    expect(comboMultiplier(0)).toBe(1)
    expect(comboMultiplier(4)).toBe(1)
    expect(comboMultiplier(5)).toBe(2)
    expect(comboMultiplier(9)).toBe(2)
    expect(comboMultiplier(10)).toBe(3)
    expect(comboMultiplier(15)).toBe(3)
  })

  it('applyHit updates streak, maxStreak, hits and score', () => {
    let state = createInitialScoringState()
    expect(state.score).toBe(0)

    state = applyHit(state, 100)
    expect(state.streak).toBe(1)
    expect(state.hits).toBe(1)
    expect(state.score).toBe(100)

    // Build up streak to 5
    state = applyHit(state, 100) // streak 2 (100)
    state = applyHit(state, 100) // streak 3 (100)
    state = applyHit(state, 100) // streak 4 (100)
    expect(state.score).toBe(400)

    state = applyHit(state, 100) // streak 5 (200 pts)
    expect(state.streak).toBe(5)
    expect(state.maxStreak).toBe(5)
    expect(state.score).toBe(600)
  })

  it('applyMiss resets streak and does not drop score below 0', () => {
    let state = createInitialScoringState()
    state = applyHit(state, 100)
    expect(state.streak).toBe(1)

    state = applyMiss(state, 500)
    expect(state.streak).toBe(0)
    expect(state.misses).toBe(1)
    expect(state.score).toBe(0)
  })
})
