import { describe, it, expect } from 'vitest'
import { buildSwipeDeck } from '../deck-builder'
import type { FalseFriend } from '@/lib/false-friends/types'

const sampleEntries: FalseFriend[] = [
  {
    id: 'actually',
    word: 'actually',
    looksLike: 'actualmente',
    actualMeaning: 'en realidad',
    correctWord: 'currently',
    kind: 'meaning-shift',
    cefr_level: 'A2',
    prompts: [
      {
        sentence: 'I ___ wanted to ask you something.',
        options: ['actually', 'currently'],
        answer: 0,
        explain: 'actually = en realidad',
      },
    ],
  },
  {
    id: 'assist',
    word: 'assist',
    looksLike: 'asistir',
    actualMeaning: 'ayudar',
    correctWord: 'attend',
    kind: 'partial-overlap',
    cefr_level: 'B1',
    prompts: [],
  },
]

describe('False Friends Swipe deck builder', () => {
  it('excludes partial-overlap entries from swipe deck', () => {
    const deck = buildSwipeDeck(sampleEntries)
    expect(deck.some((card) => card.friendId === 'assist')).toBe(false)
    expect(deck.some((card) => card.friendId === 'actually')).toBe(true)
  })
})
