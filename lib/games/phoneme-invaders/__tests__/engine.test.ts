import { describe, it, expect } from 'vitest'
import {
  createInitialInvadersState,
  invadersReducer,
  type InvadersState,
} from '../engine'
import type { MinimalPairItem } from '../schema'

const samplePair: MinimalPairItem = {
  id: 'pair-1',
  wordA: 'ship',
  wordB: 'sheep',
  ipaA: '/ʃɪp/',
  ipaB: '/ʃiːp/',
  contrast: 'iː|ɪ',
}

describe('Phoneme Invaders engine', () => {
  it('creates initial state with 3 shields', () => {
    const s = createInitialInvadersState()
    expect(s.shields).toBe(3)
    expect(s.score).toBe(0)
    expect(s.status).toBe('playing')
  })

  it('spawns ships and sets target', () => {
    let s = createInitialInvadersState()
    s = invadersReducer(s, {
      type: 'spawn',
      pair: samplePair,
      targetSide: 'b',
      lanes: 2,
    })

    expect(s.ships.length).toBe(2)
    expect(s.target?.word).toBe('sheep')
    expect(s.targetPair?.contrast).toBe('iː|ɪ')
  })

  it('shooting target ship increases score and streak', () => {
    let s = createInitialInvadersState()
    s = invadersReducer(s, {
      type: 'spawn',
      pair: samplePair,
      targetSide: 'a',
      lanes: 2,
    })

    const targetShip = s.ships.find((ship) => ship.isTarget)!
    s = invadersReducer(s, { type: 'shoot', shipId: targetShip.id })

    expect(s.hits).toBe(1)
    expect(s.score).toBe(100)
    expect(s.streak).toBe(1)
    expect(s.ships.length).toBe(0)
  })

  it('tracks the contrast for a successful shot', () => {
    let s = createInitialInvadersState()
    s = invadersReducer(s, {
      type: 'spawn',
      pair: samplePair,
      targetSide: 'a',
      lanes: 2,
    })

    const targetShipId = s.target!.shipId
    s = invadersReducer(s, { type: 'shoot', shipId: targetShipId })

    expect(s.hitHistory).toEqual([{ contrast: 'iː|ɪ' }])
  })

  it('shooting wrong ship decreases shields and records miss', () => {
    let s = createInitialInvadersState()
    s = invadersReducer(s, {
      type: 'spawn',
      pair: samplePair,
      targetSide: 'a',
      lanes: 2,
    })

    const wrongShip = s.ships.find((ship) => !ship.isTarget)!
    s = invadersReducer(s, { type: 'shoot', shipId: wrongShip.id })

    expect(s.shields).toBe(2)
    expect(s.streak).toBe(0)
    expect(s.lastMissFlash).toEqual({
      heard: { word: 'ship', ipa: '/ʃɪp/' },
      chosen: { word: 'sheep', ipa: '/ʃiːp/' },
      distractor: { word: 'sheep', ipa: '/ʃiːp/' },
      contrast: 'iː|ɪ',
    })
  })

  it('game over when shields hit 0', () => {
    let s: InvadersState = {
      ...createInitialInvadersState(),
      shields: 1,
    }
    s = invadersReducer(s, {
      type: 'spawn',
      pair: samplePair,
      targetSide: 'a',
      lanes: 2,
    })

    const wrongShip = s.ships.find((ship) => !ship.isTarget)!
    s = invadersReducer(s, { type: 'shoot', shipId: wrongShip.id })

    expect(s.shields).toBe(0)
    expect(s.status).toBe('game_over')
  })

  it('tick increases ship position y and triggers miss on y >= 100', () => {
    let s = createInitialInvadersState()
    s = invadersReducer(s, {
      type: 'spawn',
      pair: samplePair,
      targetSide: 'a',
      lanes: 2,
    })

    s = invadersReducer(s, { type: 'tick', dy: 105 })
    expect(s.shields).toBe(2)
    expect(s.lastMissFlash?.chosen.word).toBe('Tiempo agotado')
  })
})

describe('Phoneme Invaders restart', () => {
  it('reset leaves game_over and restores a fresh state', () => {
    let s: InvadersState = { ...createInitialInvadersState(), status: 'game_over', score: 900, shields: 0 }
    s = invadersReducer(s, { type: 'reset' })
    expect(s.status).toBe('playing')
    expect(s.score).toBe(0)
    expect(s.shields).toBe(3)
    expect(s.missHistory).toEqual([])
  })
})

describe('Phoneme Invaders miss record', () => {
  it('keeps the distractor word on timeout so both can be compared', () => {
    let s = createInitialInvadersState()
    s = invadersReducer(s, { type: 'spawn', pair: samplePair, targetSide: 'a', lanes: 2 })
    s = invadersReducer(s, { type: 'tick', dy: 105 })
    expect(s.lastMissFlash?.distractor.word).toBe('sheep')
  })
})
