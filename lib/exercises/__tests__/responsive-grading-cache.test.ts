import { describe, it, expect, vi } from 'vitest'
import { createResponsiveGradingDeps } from '../responsive-grading-cache'
import type { ProductionGradeResult } from '../production-grade'

const result: ProductionGradeResult = {
  correct: true, usedTarget: true, grammaticallyCorrect: true, constraintMet: true, score: 100, feedback: 'Correcto',
}

describe('responsive grading cache', () => {
  it('publishes feedback and prevents a repeat request while the durable cache write is pending', async () => {
    const save = vi.fn(() => new Promise<void>(() => {}))
    const deps = createResponsiveGradingDeps({
      save, gradeProduction: vi.fn(), isAccepted: vi.fn(), getCached: vi.fn(),
    })
    await deps.save({ key: 'k', userId: 'u', exerciseKey: 'e', normalized: 'hello world', result, accepted: 0, createdAt: 'now' })
    expect(await deps.getCached('k')).toBe(result)
    expect(save).toHaveBeenCalledOnce()
  })

  it('does not share answers between hook instances and treats database errors as cache misses', async () => {
    const durable = { save: vi.fn().mockResolvedValue(undefined), gradeProduction: vi.fn(),
      isAccepted: vi.fn().mockRejectedValue(new Error('unavailable')), getCached: vi.fn().mockRejectedValue(new Error('unavailable')) }
    const a = createResponsiveGradingDeps(durable)
    const b = createResponsiveGradingDeps(durable)
    await a.save({ key: 'k', userId: 'u', exerciseKey: 'e', normalized: 'hello world', result, accepted: 0, createdAt: 'now' })
    expect(await b.getCached('k')).toBeUndefined()
    expect(await b.isAccepted('u', 'e', 'hello world')).toBe(false)
  })
})
