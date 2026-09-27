import { describe, it, expect } from 'vitest'
import { createInitialDuelState, duelReducer } from '../engine'
import { buildRound } from '../tokenizer'
import type { ChunkDuelItem } from '../schema'

const sampleChunk: ChunkDuelItem = {
  id: 'chunk-1',
  chunk: 'No problem at all',
  meaning: 'Ningún problema en absoluto',
  example: 'Thanks! No problem at all.',
  category: 'polite',
}

const roundSpec = buildRound(sampleChunk, [])

describe('Chunk Duel engine', () => {
  it('starts round and resets tile selections', () => {
    let s = createInitialDuelState()
    s = duelReducer(s, {
      type: 'start_round',
      round: roundSpec,
      totalRounds: 10,
      roundIndex: 1,
      ghostSpeed: 0.05,
    })

    expect(s.currentRound).toBe(roundSpec)
    expect(s.selectedTileIds).toEqual([])
    expect(s.status).toBe('playing')
  })

  it('picking correct solution tiles in order completes round with win', () => {
    let s = createInitialDuelState()
    s = duelReducer(s, {
      type: 'start_round',
      round: roundSpec,
      totalRounds: 10,
      roundIndex: 1,
      ghostSpeed: 0.05,
    })

    // Find tiles for "No", "problem", "at", "all"
    const solTokens = roundSpec.solutionTokens
    for (const token of solTokens) {
      const tile = roundSpec.tiles.find(
        (t) => t.isSolution && t.text === token && !s.selectedTileIds.includes(t.id),
      )!
      s = duelReducer(s, { type: 'pick_tile', tileId: tile.id })
    }

    expect(s.roundWon).toBe(true)
    expect(s.status).toBe('round_result')
    expect(s.score).toBe(200)
  })

  it('picking wrong tile triggers shake', () => {
    let s = createInitialDuelState()
    s = duelReducer(s, {
      type: 'start_round',
      round: roundSpec,
      totalRounds: 10,
      roundIndex: 1,
      ghostSpeed: 0.05,
    })

    const wrongTile = roundSpec.tiles.find((t) => !t.isSolution || t.text !== roundSpec.solutionTokens[0])!
    s = duelReducer(s, { type: 'pick_tile', tileId: wrongTile.id })

    expect(s.shakeTileId).toBe(wrongTile.id)
    expect(s.selectedTileIds).toEqual([])
  })

  it('ghost reaching 100% loses round', () => {
    let s = createInitialDuelState()
    s = duelReducer(s, {
      type: 'start_round',
      round: roundSpec,
      totalRounds: 10,
      roundIndex: 1,
      ghostSpeed: 0.05,
    })

    s = duelReducer(s, { type: 'tick', dt: 2500 })
    expect(s.ghostProgress).toBe(100)
    expect(s.roundWon).toBe(false)
    expect(s.status).toBe('round_result')
  })
})
