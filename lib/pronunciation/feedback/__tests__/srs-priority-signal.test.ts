import { describe, expect, it } from 'vitest'
import {
  computePriorityBoost,
  MAX_PRIORITY_BOOST,
} from '../srs-priority-signal'

describe('computePriorityBoost', () => {
  it('no sube nada sin fallos hablados', () => {
    expect(computePriorityBoost({ spokenFailures: 0, spokenAttempts: 3 })).toBe(0)
  })

  it('sube la prioridad cuando se falla al hablar', () => {
    const boost = computePriorityBoost({ spokenFailures: 2, spokenAttempts: 3 })
    expect(boost).toBeGreaterThan(0)
  })

  it('nunca supera el techo, por muchos fallos que haya', () => {
    const boost = computePriorityBoost({ spokenFailures: 500, spokenAttempts: 500 })
    expect(boost).toBeLessThanOrEqual(MAX_PRIORITY_BOOST)
  })

  it('devuelve 0 sin intentos, en lugar de dividir por cero', () => {
    expect(computePriorityBoost({ spokenFailures: 0, spokenAttempts: 0 })).toBe(0)
  })

  it('ignora fallos incoherentes con los intentos', () => {
    expect(computePriorityBoost({ spokenFailures: 5, spokenAttempts: 2 }))
      .toBeLessThanOrEqual(MAX_PRIORITY_BOOST)
  })
})
