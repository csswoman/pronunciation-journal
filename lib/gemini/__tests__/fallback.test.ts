import { describe, expect, it } from 'vitest'
import {
  BASE_MODELS,
  PREMIUM_MODELS,
  QUALITY_FALLBACK_MODELS,
  getErrorStatus,
  getFastThinkingConfig,
  shouldTryNextModel,
} from '@/lib/gemini/fallback'

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
    expect(BASE_MODELS).toEqual([
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-2.5-flash-lite',
    ])
    expect(QUALITY_FALLBACK_MODELS).toEqual([
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ])
    expect(BASE_MODELS.length).toBeLessThanOrEqual(3)
    expect(QUALITY_FALLBACK_MODELS.length).toBeLessThanOrEqual(3)
    expect(PREMIUM_MODELS).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash-lite'])
  })

  it('provides thinkingBudget: 0 only to thinking-enabled models', () => {
    expect(getFastThinkingConfig('gemini-3.7-flash')).toEqual({ thinkingBudget: 0 })
    expect(getFastThinkingConfig('gemini-2.5-flash-lite')).toBeUndefined()
    expect(getFastThinkingConfig('gemini-3.5-flash-lite')).toBeUndefined()
  })
})
