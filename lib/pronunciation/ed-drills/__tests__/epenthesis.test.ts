import { describe, expect, it } from 'vitest'
import { detectSuspectedEpenthesis, EPENTHESIS_DURATION_RATIO } from '../epenthesis'

describe('detectSuspectedEpenthesis', () => {
  it('marca sospecha cuando el usuario tarda >40% más que el modelo', () => {
    expect(detectSuspectedEpenthesis(1500, 1000)).toBe(true)
  })

  it('no marca sospecha en el umbral exacto', () => {
    expect(detectSuspectedEpenthesis(1400, 1000)).toBe(false)
  })

  it('no marca sospecha cuando el usuario va más rápido', () => {
    expect(detectSuspectedEpenthesis(800, 1000)).toBe(false)
  })

  it('devuelve false con duraciones no utilizables en vez de lanzar', () => {
    expect(detectSuspectedEpenthesis(1500, 0)).toBe(false)
    expect(detectSuspectedEpenthesis(0, 1000)).toBe(false)
    expect(detectSuspectedEpenthesis(Number.NaN, 1000)).toBe(false)
  })

  it('expone el ratio como constante documentada', () => {
    expect(EPENTHESIS_DURATION_RATIO).toBe(1.4)
  })
})
