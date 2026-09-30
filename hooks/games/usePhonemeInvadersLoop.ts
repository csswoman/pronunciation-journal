'use client'

import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import {
  createInitialInvadersState,
  invadersReducer,
} from '@/lib/games/phoneme-invaders/engine'
import type { MinimalPairItem } from '@/lib/games/phoneme-invaders/schema'
import { speak } from '@/lib/phoneme-practice/tts'
import { finishAttributedContrastSessions } from '@/lib/phoneme-practice/finish-session'
import { recordGameActivity } from '@/lib/progress/game-activity'
import type { ExerciseResult, SessionResult } from '@/lib/practice/types'
import { useAuth } from '@/components/auth/AuthProvider'
import { isAnonymousUser } from '@/lib/auth/is-anonymous'

export function usePhonemeInvadersLoop(pairs: MinimalPairItem[]) {
  const { user } = useAuth()
  const isGuest = isAnonymousUser(user)
  const userId = user?.id ?? null
  const [state, dispatch] = useReducer(
    invadersReducer,
    createInitialInvadersState(),
  )
  const [isPlaying, setIsPlaying] = useState(false)

  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  const playTargetAudio = useCallback((word: string) => {
    if (!word) return
    speak(word, { rate: 0.9 })
  }, [])

  const spawnNextPair = useCallback((lanes: number = state.laneCount) => {
    if (pairs.length === 0) return
    const pair = pairs[Math.floor(Math.random() * pairs.length)]
    const targetSide = Math.random() < 0.5 ? 'a' : 'b'
    dispatch({ type: 'spawn', pair, targetSide, lanes })
  }, [pairs, state.laneCount])

  const recordedRef = useRef(false)

  const startGame = useCallback(() => {
    startTimeRef.current = Date.now()
    recordedRef.current = false
    dispatch({ type: 'reset' })
    setIsPlaying(true)
    spawnNextPair(createInitialInvadersState().laneCount)
  }, [spawnNextPair])

  useEffect(() => {
    if (isPlaying && state.target?.word) {
      playTargetAudio(state.target.word)
    }
  }, [isPlaying, state.target?.word, playTargetAudio])

  useEffect(() => {
    if (
      isPlaying &&
      state.status === 'playing' &&
      state.ships.length === 0 &&
      !state.lastMissFlash
    ) {
      spawnNextPair()
    }
  }, [isPlaying, state.status, state.ships.length, state.lastMissFlash, spawnNextPair])

  useEffect(() => {
    if (!isPlaying || state.status !== 'playing' || state.lastMissFlash) return

    const loop = (timestamp: number) => {
      if (!lastTickRef.current) lastTickRef.current = timestamp
      const delta = timestamp - lastTickRef.current
      lastTickRef.current = timestamp

      // Wave 1 ≈ 6 s to land (time to hear the word and decide); wave 5 ≈ 3.5 s
      const speedFactor = 0.014 + state.wave * 0.003
      const dy = delta * speedFactor
      dispatch({ type: 'tick', dy })

      rafRef.current = requestAnimationFrame(loop)
    }

    lastTickRef.current = performance.now()
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, state.status, state.wave, state.lastMissFlash])

  useEffect(() => {
    if (state.status === 'game_over' && !recordedRef.current && userId && !isGuest) {
      recordedRef.current = true
      const elapsed = Date.now() - startTimeRef.current
      void recordGameActivity(
        userId,
        'phoneme_invaders',
        elapsed,
        'phoneme-invaders',
        ['listening', 'pronunciation'],
        { hits: state.hits, misses: state.misses, slug: 'minimal_pair' },
      )

      const total = state.hits + state.misses
      const perResultMs = total > 0 ? Math.round(elapsed / total) : 0
      const sessionResult: SessionResult = {
        results: [
          ...state.hitHistory.map((hit, index): ExerciseResult => ({
            exerciseId: `phoneme-invaders-hit-${index}`,
            slug: 'minimal_pair',
            exerciseTypeId: null,
            isCorrect: true,
            timeMs: perResultMs,
            contentId: `phoneme-invaders-hit-${index}`,
            context: 'practice',
            exercisePayload: { contrastId: hit.contrast },
            completedAt: new Date(),
          })),
          ...state.missHistory.map((miss, index): ExerciseResult => ({
            exerciseId: `phoneme-invaders-miss-${index}`,
            slug: 'minimal_pair',
            exerciseTypeId: null,
            isCorrect: false,
            timeMs: perResultMs,
            contentId: `phoneme-invaders-miss-${index}`,
            context: 'practice',
            exercisePayload: { contrastId: miss.contrast },
            completedAt: new Date(),
          })),
        ],
        accuracy: total > 0 ? (state.hits / total) * 100 : 0,
        totalTimeMs: Math.max(0, Math.round(elapsed)),
        bySlug: {} as SessionResult['bySlug'],
      }
      void finishAttributedContrastSessions(userId, sessionResult).catch((err) => {
        console.warn('[PhonemeInvaders] contrast SRS update failed', err)
      })
    }
  }, [
    state.status,
    state.hits,
    state.misses,
    state.hitHistory,
    state.missHistory,
    userId,
    isGuest,
  ])

  const shootShip = useCallback((shipId: string) => {
    dispatch({ type: 'shoot', shipId })
  }, [])

  const repeatAudio = useCallback(() => {
    if (state.target?.word) {
      playTargetAudio(state.target.word)
    }
  }, [state.target?.word, playTargetAudio])

  const dismissFlash = useCallback(() => {
    dispatch({ type: 'clear_flash' })
  }, [])

  return {
    state,
    isPlaying,
    startGame,
    shootShip,
    repeatAudio,
    dismissFlash,
  }
}
