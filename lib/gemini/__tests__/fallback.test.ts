import { describe, expect, it } from 'vitest'
import { getErrorStatus, shouldTryNextModel } from '@/lib/gemini/fallback'

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
})
