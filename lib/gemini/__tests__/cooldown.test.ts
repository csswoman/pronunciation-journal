import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  _resetModelCooldowns,
  filterAvailable,
  getRetryDelayMs,
  markCooldown,
  markCooldownFromError,
} from '@/lib/gemini/cooldown'

describe('Gemini model cooldowns', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-24T12:00:00Z'))
    _resetModelCooldowns()
  })

  afterEach(() => {
    _resetModelCooldowns()
    vi.useRealTimers()
  })

  it('skips a model after a 429 and uses Retry-After when supplied', () => {
    markCooldownFromError('gemini-a', { status: 429, headers: { 'Retry-After': '2' } })

    expect(filterAvailable(['gemini-a', 'gemini-b'])).toEqual(['gemini-b'])
    vi.advanceTimersByTime(2_001)
    expect(filterAvailable(['gemini-a', 'gemini-b'])).toEqual(['gemini-a', 'gemini-b'])
  })

  it('uses the default one-minute cooldown and expires it', () => {
    markCooldown('gemini-a')

    expect(filterAvailable(['gemini-a'])).toEqual(['gemini-a'])
    vi.advanceTimersByTime(60_001)
    expect(filterAvailable(['gemini-a'])).toEqual(['gemini-a'])
  })

  it('returns the original chain when every model is cooling down', () => {
    markCooldown('gemini-a')
    markCooldown('gemini-b')

    expect(filterAvailable(['gemini-a', 'gemini-b'])).toEqual(['gemini-a', 'gemini-b'])
  })

  it('reads Google retryDelay values', () => {
    expect(getRetryDelayMs({ error: { details: [{ retryDelay: '3.5s' }] } })).toBe(3_500)
  })
})
