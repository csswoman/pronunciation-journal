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

  it('maps budgets 5/9/15 and new ceilings 2/3/5', () => {
    expect(sessionSizeById('short')).toEqual({ wordBudget: 5, newCardCeiling: 2 })
    expect(sessionSizeById('recommended')).toEqual({ wordBudget: 9, newCardCeiling: 3 })
    expect(sessionSizeById('long')).toEqual({ wordBudget: 15, newCardCeiling: 5 })
    expect(SESSION_SIZES.map((s) => s.label)).toEqual([
      'Corta · 5',
      'Recomendada · 9',
      'Larga · 15',
    ])
  })

  it('persists preference in localStorage', () => {
    expect(readSessionSizePreference()).toBe('recommended')
    writeSessionSizePreference('long')
    expect(readSessionSizePreference()).toBe('long')
  })
})
