import { describe, expect, it } from 'vitest'
import { evaluateLine } from '../FocusSongVoicePractice'

describe('evaluateLine', () => {
  it('puntúa palabras reconocidas sin inventar precisión fonética', () => {
    expect(evaluateLine('I will sing today', 'I will sing today')).toEqual({ score: 100, missed: [] })
    expect(evaluateLine('I will sing today', 'I sing today')).toEqual({ score: 75, missed: ['will'] })
  })
})
