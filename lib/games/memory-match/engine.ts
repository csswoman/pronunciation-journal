import { applyHit, applyMiss, type BaseScoringState } from '@/lib/games/shared/scoring'
import type { MemoryWordItem } from './schema'

export type MemoryCardKind = 'word' | 'meaning' | 'audio' | 'ipa'

export type MemoryCard = {
  id: string
  pairId: string
  kind: MemoryCardKind
  content: string
  word: string
  isFlipped: boolean
  isMatched: boolean
}

export type MemoryMatchMode = 'word_meaning' | 'audio_word' | 'word_ipa'

export interface MemoryState extends BaseScoringState {
  cards: MemoryCard[]
  flippedCardIds: string[]
  attempts: number
  pairAttempts: Record<string, number>
  matchedPairIds: string[]
  isResolvingMismatch: boolean
  status: 'playing' | 'completed'
  mode: MemoryMatchMode
  totalPairs: number
}

export type MemoryAction =
  | {
      type: 'start'
      words: MemoryWordItem[]
      mode: MemoryMatchMode
      pairCount: number
      rng?: () => number
    }
  | { type: 'flip'; cardId: string }
  | { type: 'resolve_mismatch' }

export function createInitialMemoryState(): MemoryState {
  return {
    score: 0,
    streak: 0,
    maxStreak: 0,
    hits: 0,
    misses: 0,
    cards: [],
    flippedCardIds: [],
    attempts: 0,
    pairAttempts: {},
    matchedPairIds: [],
    isResolvingMismatch: false,
    status: 'playing',
    mode: 'word_meaning',
    totalPairs: 6,
  }
}

export function buildMemoryCards(
  words: MemoryWordItem[],
  mode: MemoryMatchMode,
  pairCount: number,
  rng: () => number = Math.random,
): MemoryCard[] {
  const selectedWords = words.slice(0, pairCount)
  const cards: MemoryCard[] = []

  for (const item of selectedWords) {
    const pairId = item.id

    if (mode === 'word_meaning') {
      cards.push({
        id: `${pairId}-word`,
        pairId,
        kind: 'word',
        content: item.word,
        word: item.word,
        isFlipped: false,
        isMatched: false,
      })
      cards.push({
        id: `${pairId}-meaning`,
        pairId,
        kind: 'meaning',
        content: item.meaningEs,
        word: item.word,
        isFlipped: false,
        isMatched: false,
      })
    } else if (mode === 'audio_word') {
      cards.push({
        id: `${pairId}-audio`,
        pairId,
        kind: 'audio',
        content: '🔊 Escuchar',
        word: item.word,
        isFlipped: false,
        isMatched: false,
      })
      cards.push({
        id: `${pairId}-word`,
        pairId,
        kind: 'word',
        content: item.word,
        word: item.word,
        isFlipped: false,
        isMatched: false,
      })
    } else {
      cards.push({
        id: `${pairId}-word`,
        pairId,
        kind: 'word',
        content: item.word,
        word: item.word,
        isFlipped: false,
        isMatched: false,
      })
      cards.push({
        id: `${pairId}-ipa`,
        pairId,
        kind: 'ipa',
        content: item.ipa,
        word: item.word,
        isFlipped: false,
        isMatched: false,
      })
    }
  }

  // Shuffle cards
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = cards[i]!
    cards[i] = cards[j]!
    cards[j] = temp
  }

  return cards
}

export function memoryReducer(
  state: MemoryState,
  action: MemoryAction,
): MemoryState {
  switch (action.type) {
    case 'start': {
      const cards = buildMemoryCards(
        action.words,
        action.mode,
        action.pairCount,
        action.rng,
      )
      return {
        ...createInitialMemoryState(),
        cards,
        mode: action.mode,
        totalPairs: Math.min(cards.length / 2, action.pairCount),
      }
    }

    case 'flip': {
      if (state.isResolvingMismatch || state.flippedCardIds.length >= 2) {
        return state
      }

      const targetCard = state.cards.find((c) => c.id === action.cardId)
      if (!targetCard || targetCard.isFlipped || targetCard.isMatched) {
        return state
      }

      const newFlipped = [...state.flippedCardIds, action.cardId]
      const updatedCards = state.cards.map((c) =>
        c.id === action.cardId ? { ...c, isFlipped: true } : c,
      )

      if (newFlipped.length === 1) {
        return {
          ...state,
          cards: updatedCards,
          flippedCardIds: newFlipped,
        }
      }

      // 2 cards flipped! Check match
      const [firstId, secondId] = newFlipped
      const firstCard = updatedCards.find((c) => c.id === firstId)!
      const secondCard = updatedCards.find((c) => c.id === secondId)!
      const pairId = firstCard.pairId

      const currentPairAttempts = (state.pairAttempts[pairId] || 0) + 1
      const updatedPairAttempts = {
        ...state.pairAttempts,
        [pairId]: currentPairAttempts,
      }
      const newAttemptsCount = state.attempts + 1

      if (firstCard.pairId === secondCard.pairId) {
        // Match found!
        const hitState = applyHit(state, 150)
        const matchedPairIds = [...state.matchedPairIds, pairId]
        const isCompleted = matchedPairIds.length >= state.totalPairs

        const finalCards = updatedCards.map((c) =>
          c.pairId === pairId ? { ...c, isMatched: true, isFlipped: true } : c,
        )

        return {
          ...hitState,
          cards: finalCards,
          flippedCardIds: [],
          attempts: newAttemptsCount,
          pairAttempts: updatedPairAttempts,
          matchedPairIds,
          status: isCompleted ? 'completed' : 'playing',
        }
      } else {
        // Mismatch!
        const missState = applyMiss(state)
        return {
          ...missState,
          cards: updatedCards,
          flippedCardIds: newFlipped,
          attempts: newAttemptsCount,
          pairAttempts: updatedPairAttempts,
          isResolvingMismatch: true,
        }
      }
    }

    case 'resolve_mismatch': {
      if (!state.isResolvingMismatch) return state

      const resetCards = state.cards.map((c) =>
        state.flippedCardIds.includes(c.id) ? { ...c, isFlipped: false } : c,
      )

      return {
        ...state,
        cards: resetCards,
        flippedCardIds: [],
        isResolvingMismatch: false,
      }
    }
  }
}
