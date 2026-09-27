import { applyHit, applyMiss, type BaseScoringState } from '@/lib/games/shared/scoring'
import type { SwipeCard } from './deck-builder'

export type SwipeMissRecord = {
  card: SwipeCard
  userAnswer: 'true' | 'trap' | 'timeout'
}

export interface SwipeState extends BaseScoringState {
  deck: SwipeCard[]
  currentIndex: number
  currentCard: SwipeCard | null
  cardTimeY: number
  status: 'swiping' | 'showing_verdict' | 'rescue_round' | 'completed'
  lastVerdict: {
    card: SwipeCard
    isCorrect: boolean
    userAnswer: 'true' | 'trap' | 'timeout'
  } | null
  missHistory: SwipeMissRecord[]
  rescueIndex: number
  rescueSuccesses: number
}

export type SwipeAction =
  | { type: 'start'; deck: SwipeCard[] }
  | { type: 'answer'; choice: 'true' | 'trap' }
  | { type: 'tick'; dy: number }
  | { type: 'dismiss_verdict' }
  | { type: 'answer_rescue'; choiceIndex: number }

export function createInitialSwipeState(): SwipeState {
  return {
    score: 0,
    streak: 0,
    maxStreak: 0,
    hits: 0,
    misses: 0,
    deck: [],
    currentIndex: 0,
    currentCard: null,
    cardTimeY: 0,
    status: 'swiping',
    lastVerdict: null,
    missHistory: [],
    rescueIndex: 0,
    rescueSuccesses: 0,
  }
}

export function swipeReducer(
  state: SwipeState,
  action: SwipeAction,
): SwipeState {
  if (state.status === 'completed') return state

  switch (action.type) {
    case 'start': {
      if (action.deck.length === 0) return { ...state, status: 'completed' }
      return {
        ...createInitialSwipeState(),
        deck: action.deck,
        currentIndex: 0,
        currentCard: action.deck[0],
        status: 'swiping',
      }
    }

    case 'tick': {
      if (state.status !== 'swiping' || !state.currentCard) return state

      const newTime = state.cardTimeY + action.dy
      if (newTime >= 100) {
        // Timeout miss!
        const missState = applyMiss(state)
        const missRecord: SwipeMissRecord = {
          card: state.currentCard,
          userAnswer: 'timeout',
        }

        return {
          ...missState,
          cardTimeY: 0,
          status: 'showing_verdict',
          lastVerdict: {
            card: state.currentCard,
            isCorrect: false,
            userAnswer: 'timeout',
          },
          missHistory: [...state.missHistory, missRecord],
        }
      }

      return { ...state, cardTimeY: newTime }
    }

    case 'answer': {
      if (state.status !== 'swiping' || !state.currentCard) return state

      const isTrap = state.currentCard.isTrap
      const isCorrect =
        (action.choice === 'trap' && isTrap) ||
        (action.choice === 'true' && !isTrap)

      if (isCorrect) {
        const hitState = applyHit(state, 120)
        return {
          ...hitState,
          cardTimeY: 0,
          status: 'showing_verdict',
          lastVerdict: {
            card: state.currentCard,
            isCorrect: true,
            userAnswer: action.choice,
          },
        }
      } else {
        const missState = applyMiss(state)
        const missRecord: SwipeMissRecord = {
          card: state.currentCard,
          userAnswer: action.choice,
        }
        return {
          ...missState,
          cardTimeY: 0,
          status: 'showing_verdict',
          lastVerdict: {
            card: state.currentCard,
            isCorrect: false,
            userAnswer: action.choice,
          },
          missHistory: [...state.missHistory, missRecord],
        }
      }
    }

    case 'dismiss_verdict': {
      const nextIdx = state.currentIndex + 1
      if (nextIdx >= state.deck.length) {
        // Transition to rescue round if there were misses, else complete
        if (state.missHistory.length > 0) {
          return {
            ...state,
            status: 'rescue_round',
            rescueIndex: 0,
            lastVerdict: null,
            currentCard: null,
          }
        }
        return { ...state, status: 'completed', lastVerdict: null }
      }

      return {
        ...state,
        currentIndex: nextIdx,
        currentCard: state.deck[nextIdx] ?? null,
        status: 'swiping',
        cardTimeY: 0,
        lastVerdict: null,
      }
    }

    case 'answer_rescue': {
      if (state.status !== 'rescue_round') return state
      const currentMiss = state.missHistory[state.rescueIndex]
      if (!currentMiss) return state

      const isCorrect =
        action.choiceIndex === currentMiss.card.prompt.answer

      const nextRescueIdx = state.rescueIndex + 1
      const newSuccesses = isCorrect
        ? state.rescueSuccesses + 1
        : state.rescueSuccesses
      const isRescueDone = nextRescueIdx >= state.missHistory.length

      return {
        ...state,
        rescueIndex: nextRescueIdx,
        rescueSuccesses: newSuccesses,
        score: isCorrect ? state.score + 100 : state.score,
        status: isRescueDone ? 'completed' : 'rescue_round',
      }
    }
  }
}
