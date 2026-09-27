import { describe, it, expect } from 'vitest'
import { PRACTICE_GAMES } from '../practice-games'
import { PRACTICE_MODES } from '../practice-modes'

describe('PRACTICE_GAMES registry', () => {
  it('every game has a unique href', () => {
    const hrefs = PRACTICE_GAMES.map((g) => g.href)
    const uniqueHrefs = new Set(hrefs)
    expect(uniqueHrefs.size).toBe(hrefs.length)
  })

  it('every game has a valid skill tag', () => {
    const validSkills = new Set(['vocabulary', 'listening', 'pronunciation', 'grammar'])
    for (const game of PRACTICE_GAMES) {
      expect(validSkills.has(game.skill)).toBe(true)
    }
  })

  it('every game has modeId present or mapped in practice ecosystem', () => {
    const validModeIds = new Set(PRACTICE_MODES.map((m) => m.id))
    for (const game of PRACTICE_GAMES) {
      expect(game.modeId).toBeTruthy()
      expect(validModeIds.has(game.modeId)).toBe(true)
    }
  })
})
