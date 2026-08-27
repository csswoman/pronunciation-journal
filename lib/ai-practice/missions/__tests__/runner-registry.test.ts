import { describe, expect, it } from 'vitest'
import { getRunnerFor, MISSION_RUNNERS } from '../runner-registry'
import type { MissionMode } from '../types'

describe('runner registry', () => {
  it('cubre todos los modos declarados', () => {
    const modes: MissionMode[] = ['conversational', 'scripted']
    for (const mode of modes) {
      expect(MISSION_RUNNERS[mode]).toBeDefined()
    }
  })

  it('devuelve el runner del modo pedido', () => {
    expect(getRunnerFor('scripted').mode).toBe('scripted')
    expect(getRunnerFor('conversational').mode).toBe('conversational')
  })
})
