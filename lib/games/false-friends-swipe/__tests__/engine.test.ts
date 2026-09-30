import { describe, it, expect } from 'vitest'
import { createInitialSwipeState, swipeReducer, type SwipeState } from '../engine'
import type { SwipeCard } from '../deck-builder'

const sampleCard: SwipeCard = {
  id: 'c1',
  friendId: 'actually',
  word: 'actually',
  displayedMeaning: 'actualmente',
  isTrap: true,
  explanation: '«actually» = en realidad. «actualmente» = currently.',
  prompt: {
    sentence: 'I am ___ working.',
    options: ['actually', 'currently'],
    answer: 1,
    explain: 'currently = actualmente',
  },
  friend: {
    id: 'actually',
    word: 'actually',
    looksLike: 'actualmente',
    actualMeaning: 'en realidad',
    correctWord: 'currently',
    kind: 'meaning-shift',
    cefr_level: 'A2',
    prompts: [],
  },
}

describe('False Friends Swipe engine', () => {
  it('correctly evaluates trap choice', () => {
    let s = createInitialSwipeState()
    s = swipeReducer(s, { type: 'start', deck: [sampleCard] })

    // Choosing 'trap' for a trap card is correct
    s = swipeReducer(s, { type: 'answer', choice: 'trap' })
    expect(s.status).toBe('showing_verdict')
    expect(s.lastVerdict?.isCorrect).toBe(true)
    expect(s.score).toBe(120)
  })

  it('wrong choice adds to missHistory and opens rescue round on completion', () => {
    let s = createInitialSwipeState()
    s = swipeReducer(s, { type: 'start', deck: [sampleCard] })

    // Choosing 'true' for a trap card is wrong
    s = swipeReducer(s, { type: 'answer', choice: 'true' })
    expect(s.lastVerdict?.isCorrect).toBe(false)
    expect(s.missHistory.length).toBe(1)

    s = swipeReducer(s, { type: 'dismiss_verdict' })
    expect(s.status).toBe('rescue_round')
  })

  it('answering rescue round prompt correctly completes game', () => {
    let s = createInitialSwipeState()
    s = swipeReducer(s, { type: 'start', deck: [sampleCard] })
    s = swipeReducer(s, { type: 'answer', choice: 'true' })
    s = swipeReducer(s, { type: 'dismiss_verdict' })

    // Rescue round: answer choiceIndex 1 ("currently")
    s = swipeReducer(s, { type: 'answer_rescue', choiceIndex: 1 })
    expect(s.status).toBe('completed')
    expect(s.rescueSuccesses).toBe(1)
  })
})

describe('False Friends swipe restart', () => {
  it('start restarts a completed game', () => {
    let s: SwipeState = { ...createInitialSwipeState(), status: 'completed', score: 500 }
    s = swipeReducer(s, { type: 'start', deck: [sampleCard] })
    expect(s.status).toBe('swiping')
    expect(s.score).toBe(0)
    expect(s.currentCard?.id).toBe('c1')
  })
})
