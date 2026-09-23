import { describe, expect, it } from 'vitest'
import { resolveLearnerLevel } from '../core'

describe('resolveLearnerLevel', () => {
  it('keeps a manual level', () => {
    expect(resolveLearnerLevel({
      profileLevel: 'A2', profileSource: 'manual',
    })).toMatchObject({ level: 'A2', source: 'manual', isPlaced: false })
  })

  it('keeps assessment provenance and placement state', () => {
    expect(resolveLearnerLevel({ profileLevel: 'B1', profileSource: 'placement' }))
      .toMatchObject({ level: 'B1', source: 'placement', isPlaced: true })
  })

  it('ignores local practice estimate', () => {
    expect(resolveLearnerLevel({ profileSource: 'starter_default' }))
      .toMatchObject({ level: 'A1', source: 'starter_default' })
  })

  it('distinguishes a failed profile read from the starter default', () => {
    expect(resolveLearnerLevel({ readFailed: true }))
      .toMatchObject({ level: 'A1', source: 'unknown', isPlaced: false })
  })

  it('keeps known placement provenance after a partial read failure', () => {
    expect(resolveLearnerLevel({ profileLevel: 'B2', profileSource: 'placement', readFailed: true }))
      .toMatchObject({ level: 'B2', source: 'placement', isPlaced: true })
  })
})
