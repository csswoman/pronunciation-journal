import { describe, it, expect } from 'vitest'
import { tokenizeChunk, buildRound } from '../tokenizer'
import type { ChunkDuelItem } from '../schema'

const sampleChunk: ChunkDuelItem = {
  id: 'chunk-1',
  chunk: "Hey, how's it going?",
  meaning: '¿Cómo te va?',
  example: "Hey, how's it going? Long time no see!",
  category: 'greetings',
}

const pool: ChunkDuelItem[] = [
  sampleChunk,
  {
    id: 'chunk-2',
    chunk: 'See you later alligator',
    meaning: 'Nos vemos luego',
    example: 'See you later alligator!',
    category: 'greetings',
  },
]

describe('Chunk Duel tokenizer', () => {
  it('tokenizes chunks preserving contractions and punctuation', () => {
    const tokens = tokenizeChunk("Hey, how's it going?")
    expect(tokens).toEqual(['Hey,', "how's", 'it', 'going?'])
  })

  it('buildRound includes solution tokens and distractors', () => {
    // Seeded pseudo-rng
    let seed = 0.5
    const mockRng = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }

    const round = buildRound(sampleChunk, pool, mockRng)
    expect(round.solutionTokens).toEqual(['Hey,', "how's", 'it', 'going?'])
    expect(round.tiles.length).toBeGreaterThan(4)
    expect(round.tiles.some((t) => t.isSolution)).toBe(true)
  })
})
