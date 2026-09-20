import { describe, expect, it } from 'vitest'
import { resolveLearnerLevel } from '../core'

describe('resolveLearnerLevel', () => {
  it('keeps a manual level above a practice estimate', () => {
    expect(resolveLearnerLevel({
      profileLevel: 'A2', profileSource: 'manual', practiceLevel: 'B2', practiceConfidence: 0.9,
    })).toMatchObject({ level: 'A2', source: 'manual', isPlaced: false })
  })

  it('keeps assessment provenance and placement state', () => {
    expect(resolveLearnerLevel({ profileLevel: 'B1', profileSource: 'placement' }))
      .toMatchObject({ level: 'B1', source: 'placement', isPlaced: true })
  })

  it('uses supported practice evidence over the starter default', () => {
    expect(resolveLearnerLevel({
      profileLevel: 'A1', profileSource: 'starter_default', practiceLevel: 'B1', practiceConfidence: 0.7,
    })).toMatchObject({ level: 'B1', source: 'practice_estimate', confidence: 0.7 })
  })

  it('does not promote a weak estimate', () => {
    expect(resolveLearnerLevel({ practiceLevel: 'C1', practiceConfidence: 0.2 }))
      .toMatchObject({ level: 'A1', source: 'starter_default' })
  })
})
