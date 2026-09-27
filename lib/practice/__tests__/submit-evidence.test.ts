import { describe, expect, it } from 'vitest'
import { normalizeSubmitEvidence } from '../submit-evidence'

describe('normalizeSubmitEvidence', () => {
  const states = ['answered', 'unscored', 'evaluator_failed', 'skipped'] as const
  for (const status of states) {
    for (const resultStatus of states) {
      it(`${status} + ${resultStatus} keeps the most restrictive evidence`, () => {
        const expected = states[Math.max(states.indexOf(status), states.indexOf(resultStatus))]
        const result = normalizeSubmitEvidence({ status, resultStatus, score: 0, hintsUsed: 2 }, 'answer')
        expect(result).toEqual({ status: expected, score: 0, hintsUsed: 2 })
        expect(result).not.toHaveProperty('resultStatus')
      })
    }
  }
  it('supports legacy answers and the legacy skip sentinel', () => {
    expect(normalizeSubmitEvidence(undefined, 'answer')).toEqual({ status: 'answered' })
    expect(normalizeSubmitEvidence({ status: 'answered', resultStatus: 'unscored' }, 'skip').status).toBe('skipped')
  })
})
