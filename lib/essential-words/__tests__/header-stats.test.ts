import { describe, expect, it } from 'vitest'
import { essentialWordsHeaderStatsLine } from '../header-stats'

describe('essentialWordsHeaderStatsLine', () => {
  it('reports in-progress deck size when the learner has started', () => {
    expect(essentialWordsHeaderStatsLine(12, 200, 0)).toBe('12 de 200 palabras en curso')
  })

  it('reports pending reviews when nothing is in progress yet', () => {
    expect(essentialWordsHeaderStatsLine(0, 200, 3)).toBe('3 repasos pendientes')
  })

  it('uses singular copy for one review', () => {
    expect(essentialWordsHeaderStatsLine(0, 200, 1)).toBe('1 repaso pendiente')
  })

  it('falls back to ready-to-practice copy', () => {
    expect(essentialWordsHeaderStatsLine(0, 200, 0)).toBe('200 palabras listas para practicar')
  })
})
