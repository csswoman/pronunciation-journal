'use client'

import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import {
  createInitialMemoryState,
  memoryReducer,
  type MemoryMatchMode,
} from '@/lib/games/memory-match/engine'
import type { MemoryWordItem } from '@/lib/games/memory-match/schema'
import { speak } from '@/lib/phoneme-practice/tts'
import { recordGameActivity } from '@/lib/progress/game-activity'
import { useAuth } from '@/components/auth/AuthProvider'
import { isAnonymousUser } from '@/lib/auth/is-anonymous'

export function useMemoryMatchLoop(words: MemoryWordItem[]) {
  const { user } = useAuth()
  const isGuest = isAnonymousUser(user)
  const userId = user?.id ?? null
  const [state, dispatch] = useReducer(
    memoryReducer,
    createInitialMemoryState(),
  )
  const [isPlaying, setIsPlaying] = useState(false)
  const startTimeRef = useRef<number>(0)
  const mismatchTimerRef = useRef<NodeJS.Timeout | null>(null)

  const startGame = useCallback(
    (mode: MemoryMatchMode, pairCount: number) => {
      if (words.length === 0) return
      startTimeRef.current = Date.now()
      setIsPlaying(true)
      dispatch({ type: 'start', words, mode, pairCount })
    },
    [words],
  )

  // Auto-resolve mismatch after 900ms
  useEffect(() => {
    if (state.isResolvingMismatch) {
      mismatchTimerRef.current = setTimeout(() => {
        dispatch({ type: 'resolve_mismatch' })
      }, 900)
    }
    return () => {
      if (mismatchTimerRef.current) clearTimeout(mismatchTimerRef.current)
    }
  }, [state.isResolvingMismatch])

  // Play audio when an audio card is flipped
  const flipCard = useCallback(
    (cardId: string) => {
      const card = state.cards.find((c) => c.id === cardId)
      if (card && (card.kind === 'audio' || card.kind === 'word')) {
        speak(card.word, { rate: 0.9 })
      }
      dispatch({ type: 'flip', cardId })
    },
    [state.cards],
  )

  // Record activity when completed
  const recordedRef = useRef(false)
  useEffect(() => {
    if (state.status === 'completed' && !recordedRef.current && userId && !isGuest) {
      recordedRef.current = true
      const elapsed = Date.now() - startTimeRef.current
      void recordGameActivity(userId, 'memory_match', elapsed, 'memory-match', [
        'vocabulary',
      ])
    }
  }, [state.status, userId, isGuest])

  return {
    state,
    isPlaying,
    startGame,
    flipCard,
  }
}
