import { describe, expect, it } from 'vitest'
import { scoreScriptSession, type LineScore } from '../scoring'

describe('scoreScriptSession', () => {
  it('pondera por número de fonemas, no por media de porcentajes', () => {
    // Línea larga al 50% (10 fonemas) + línea corta al 100% (2 fonemas).
    // Media simple daría 75; la ponderada da (5+2)/12 = 58.
    const lines: LineScore[] = [
      { lineId: 'l1', correctPhonemes: 5, totalPhonemes: 10 },
      { lineId: 'l2', correctPhonemes: 2, totalPhonemes: 2 },
    ]
    expect(scoreScriptSession(lines).score).toBe(58)
  })

  it('devuelve 100 con todo correcto', () => {
    const lines: LineScore[] = [{ lineId: 'l1', correctPhonemes: 4, totalPhonemes: 4 }]
    expect(scoreScriptSession(lines).score).toBe(100)
  })

  it('ignora líneas sin fonemas puntuados en lugar de contarlas como 0', () => {
    const lines: LineScore[] = [
      { lineId: 'l1', correctPhonemes: 4, totalPhonemes: 4 },
      { lineId: 'l2', correctPhonemes: 0, totalPhonemes: 0 },
    ]
    const result = scoreScriptSession(lines)
    expect(result.score).toBe(100)
    expect(result.scoredLines).toBe(1)
  })

  it('marca la sesión como no puntuable si nada se pudo evaluar', () => {
    const result = scoreScriptSession([{ lineId: 'l1', correctPhonemes: 0, totalPhonemes: 0 }])
    expect(result.score).toBeNull()
    expect(result.scoredLines).toBe(0)
  })

  it('maneja una lista vacía', () => {
    expect(scoreScriptSession([]).score).toBeNull()
  })
})
