import { describe, expect, it } from 'vitest'
import { BASE_MODELS, getErrorStatus, getFastThinkingConfig, shouldTryNextModel } from '@/lib/gemini/fallback'

describe('Gemini fallback classification', () => {
  it.each([400, 401, 403])('does not retry status %s', (status) => {
    expect(shouldTryNextModel({ status })).toBe(false)
  })

  it.each([429, 500])('retries status %s', (status) => {
    expect(shouldTryNextModel({ status })).toBe(true)
  })

  it.each(['quota exceeded', 'rate limit reached'])('retries message "%s"', (message) => {
    expect(shouldTryNextModel(new Error(message))).toBe(true)
  })

  it('reads statusCode when status is absent', () => {
    expect(getErrorStatus({ statusCode: 408 })).toBe(408)
  })

  it('prioritizes fast lite models before heavy thinking models', () => {
    const liteIndices = BASE_MODELS.map((m, i) => (m.includes('-lite') ? i : -1)).filter((i) => i !== -1)
    const thinkingIndex = BASE_MODELS.indexOf('gemini-3.7-flash')
    expect(Math.min(...liteIndices)).toBeLessThan(thinkingIndex)
  })

  it('provides thinkingBudget: 0 only to thinking-enabled models', () => {
    expect(getFastThinkingConfig('gemini-2.5-flash')).toEqual({ thinkingBudget: 0 })
    expect(getFastThinkingConfig('gemini-3.7-flash')).toEqual({ thinkingBudget: 0 })
    expect(getFastThinkingConfig('gemini-2.5-flash-lite')).toBeUndefined()
    expect(getFastThinkingConfig('gemini-3.5-flash-lite')).toBeUndefined()
  })
})
