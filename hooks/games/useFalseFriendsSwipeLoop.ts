'use client'

import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import { createInitialSwipeState, swipeReducer } from '@/lib/games/false-friends-swipe/engine'
import { buildSwipeDeck } from '@/lib/games/false-friends-swipe/deck-builder'
import type { FalseFriend } from '@/lib/false-friends/types'
import { speak } from '@/lib/phoneme-practice/tts'
import { recordGameActivity } from '@/lib/progress/game-activity'
import { useAuth } from '@/components/auth/AuthProvider'
import { isAnonymousUser } from '@/lib/auth/is-anonymous'

export function useFalseFriendsSwipeLoop(entries: FalseFriend[]) {
  const { user } = useAuth()
  const isGuest = isAnonymousUser(user)
  const userId = user?.id ?? null
  const [state, dispatch] = useReducer(swipeReducer, createInitialSwipeState())
  const [isPlaying, setIsPlaying] = useState(false)

  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  const startGame = useCallback(() => {
    if (entries.length === 0) return
    const deck = buildSwipeDeck(entries)
    startTimeRef.current = Date.now()
    setIsPlaying(true)
    dispatch({ type: 'start', deck })
  }, [entries])

  // Play audio when current card changes
  useEffect(() => {
    if (isPlaying && state.status === 'swiping' && state.currentCard) {
      speak(state.currentCard.word, { rate: 0.9 })
    }
  }, [isPlaying, state.status, state.currentCard])

  // Timer tick for 5s per card
  useEffect(() => {
    if (!isPlaying || state.status !== 'swiping') return

    const loop = (timestamp: number) => {
      if (!lastTickRef.current) lastTickRef.current = timestamp
      const delta = timestamp - lastTickRef.current
      lastTickRef.current = timestamp

      // 5s limit = ~0.02 per ms
      const dy = delta * 0.02
      dispatch({ type: 'tick', dy })

      rafRef.current = requestAnimationFrame(loop)
    }

    lastTickRef.current = performance.now()
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, state.status])

  // Record activity on completion
  const recordedRef = useRef(false)
  useEffect(() => {
    if (state.status === 'completed' && !recordedRef.current && userId && !isGuest) {
      recordedRef.current = true
      const elapsed = Date.now() - startTimeRef.current
      void recordGameActivity(
        userId,
        'false_friends_swipe',
        elapsed,
        'false-friends-swipe',
        ['vocabulary'],
      )
    }
  }, [state.status, userId, isGuest])

  const answer = useCallback((choice: 'true' | 'trap') => {
    dispatch({ type: 'answer', choice })
  }, [])

  const dismissVerdict = useCallback(() => {
    dispatch({ type: 'dismiss_verdict' })
  }, [])

  const answerRescue = useCallback((choiceIndex: number) => {
    dispatch({ type: 'answer_rescue', choiceIndex })
  }, [])

  return {
    state,
    isPlaying,
    startGame,
    answer,
    dismissVerdict,
    answerRescue,
  }
}
