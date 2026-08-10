// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import {
  loadLastEssentialWordsSession,
  saveLastEssentialWordsSession,
  type LastEssentialWordsSession,
} from '../ready-last-session'

describe('ready-last-session', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips a last-session summary per user', () => {
    expect(loadLastEssentialWordsSession('user-a')).toBeNull()

    const summary: LastEssentialWordsSession = {
      practiced: 9,
      correct: 8,
      durationMs: 342_000,
      completedAt: '2026-08-10T12:00:00.000Z',
    }
    saveLastEssentialWordsSession('user-a', summary)
    expect(loadLastEssentialWordsSession('user-a')).toEqual(summary)
    expect(loadLastEssentialWordsSession('user-b')).toBeNull()
  })
})
