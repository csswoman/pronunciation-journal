// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import {
  SESSION_SIZES,
  sessionSizeById,
  readSessionSizePreference,
  writeSessionSizePreference,
} from '../session-size'

describe('session-size', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('maps action budgets 5/15/25 and new ceilings 1/3/5', () => {
    expect(sessionSizeById('short')).toEqual({ actionBudget: 5, maxNewWords: 1 })
    expect(sessionSizeById('recommended')).toEqual({ actionBudget: 15, maxNewWords: 3 })
    expect(sessionSizeById('long')).toEqual({ actionBudget: 25, maxNewWords: 5 })
    expect(SESSION_SIZES.map((s) => s.label)).toEqual([
      'Corta · 5',
      'Recomendada · 15',
      'Larga · 25',
    ])
  })

  it('persists preference in localStorage', () => {
    expect(readSessionSizePreference()).toBe('recommended')
    writeSessionSizePreference('long')
    expect(readSessionSizePreference()).toBe('long')
  })
})
