import { describe, it, expect } from 'vitest'
import {
  createInitialMemoryState,
  memoryReducer,
} from '../engine'
import type { MemoryWordItem } from '../schema'

const sampleWords: MemoryWordItem[] = [
  { id: 'w1', word: 'apple', meaningEs: 'manzana', ipa: '/ˈæp.əl/' },
  { id: 'w2', word: 'water', meaningEs: 'agua', ipa: '/ˈwɔː.tər/' },
]

describe('Memory Match engine', () => {
  it('starts game and generates shuffled cards', () => {
    let s = createInitialMemoryState()
    s = memoryReducer(s, {
      type: 'start',
      words: sampleWords,
      mode: 'word_meaning',
      pairCount: 2,
    })

    expect(s.cards.length).toBe(4) // 2 pairs * 2 = 4 cards
    expect(s.status).toBe('playing')
    expect(s.attempts).toBe(0)
  })

  it('flipping first card opens it', () => {
    let s = createInitialMemoryState()
    s = memoryReducer(s, {
      type: 'start',
      words: sampleWords,
      mode: 'word_meaning',
      pairCount: 2,
    })

    const cardId = s.cards[0]!.id
    s = memoryReducer(s, { type: 'flip', cardId })

    expect(s.cards.find((c) => c.id === cardId)?.isFlipped).toBe(true)
    expect(s.flippedCardIds).toEqual([cardId])
  })

  it('matching pair sets isMatched true and clears flipped list', () => {
    let s = createInitialMemoryState()
    s = memoryReducer(s, {
      type: 'start',
      words: sampleWords,
      mode: 'word_meaning',
      pairCount: 2,
    })

    const card1 = s.cards.find((c) => c.pairId === 'w1' && c.kind === 'word')!
    const card2 = s.cards.find((c) => c.pairId === 'w1' && c.kind === 'meaning')!

    s = memoryReducer(s, { type: 'flip', cardId: card1.id })
    s = memoryReducer(s, { type: 'flip', cardId: card2.id })

    expect(s.matchedPairIds).toContain('w1')
    expect(s.flippedCardIds.length).toBe(0)
    expect(s.hits).toBe(1)
  })

  it('mismatch requires resolve_mismatch to close cards', () => {
    let s = createInitialMemoryState()
    s = memoryReducer(s, {
      type: 'start',
      words: sampleWords,
      mode: 'word_meaning',
      pairCount: 2,
    })

    const card1 = s.cards.find((c) => c.pairId === 'w1' && c.kind === 'word')!
    const card2 = s.cards.find((c) => c.pairId === 'w2' && c.kind === 'meaning')!

    s = memoryReducer(s, { type: 'flip', cardId: card1.id })
    s = memoryReducer(s, { type: 'flip', cardId: card2.id })

    expect(s.isResolvingMismatch).toBe(true)

    s = memoryReducer(s, { type: 'resolve_mismatch' })
    expect(s.isResolvingMismatch).toBe(false)
    expect(s.cards.find((c) => c.id === card1.id)?.isFlipped).toBe(false)
  })
})
