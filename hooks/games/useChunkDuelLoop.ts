'use client'

import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import { createInitialDuelState, duelReducer } from '@/lib/games/chunk-duel/engine'
import { buildRound } from '@/lib/games/chunk-duel/tokenizer'
import type { ChunkDuelItem } from '@/lib/games/chunk-duel/schema'
import { speak } from '@/lib/phoneme-practice/tts'
import { recordGameActivity } from '@/lib/progress/game-activity'
import { useAuth } from '@/components/auth/AuthProvider'
import { isAnonymousUser } from '@/lib/auth/is-anonymous'

export function useChunkDuelLoop(pool: ChunkDuelItem[]) {
  const { user } = useAuth()
  const isGuest = isAnonymousUser(user)
  const userId = user?.id ?? null
  const [state, dispatch] = useReducer(duelReducer, createInitialDuelState())
  const [isPlaying, setIsPlaying] = useState(false)

  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  const currentRoundIndexRef = useRef(1)
  const totalRounds = 10

  const startNextRound = useCallback(() => {
    if (pool.length === 0) return
    const chunkItem = pool[Math.floor(Math.random() * pool.length)]!
    const round = buildRound(chunkItem, pool)
    const ghostSpeed = 0.03 + currentRoundIndexRef.current * 0.005

    dispatch({
      type: 'start_round',
      round,
      totalRounds,
      roundIndex: currentRoundIndexRef.current,
      ghostSpeed,
    })
  }, [pool])

  const recordedRef = useRef(false)

  const startGame = useCallback(() => {
    if (pool.length === 0) return
    currentRoundIndexRef.current = 1
    startTimeRef.current = Date.now()
    recordedRef.current = false
    dispatch({ type: 'reset' })
    setIsPlaying(true)
    startNextRound()
  }, [pool, startNextRound])

  // A wrong tile shakes briefly, then settles so it can be read again
  useEffect(() => {
    if (!state.shakeTileId) return
    const timer = setTimeout(() => dispatch({ type: 'clear_shake' }), 450)
    return () => clearTimeout(timer)
  }, [state.shakeTileId])

  // Play audio when round is won
  useEffect(() => {
    if (state.roundWon === true && state.currentRound?.chunkItem.chunk) {
      speak(state.currentRound.chunkItem.chunk, { rate: 0.9 })
    }
  }, [state.roundWon, state.currentRound?.chunkItem.chunk])

  // Loop for ghost bar
  useEffect(() => {
    if (!isPlaying || state.status !== 'playing') return

    const loop = (timestamp: number) => {
      if (!lastTickRef.current) lastTickRef.current = timestamp
      const dt = timestamp - lastTickRef.current
      lastTickRef.current = timestamp

      dispatch({ type: 'tick', dt })
      rafRef.current = requestAnimationFrame(loop)
    }

    lastTickRef.current = performance.now()
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, state.status])

  // Record activity when 10 rounds finish
  useEffect(() => {
    if (state.status === 'game_over' && !recordedRef.current && userId && !isGuest) {
      recordedRef.current = true
      const elapsed = Date.now() - startTimeRef.current
      void recordGameActivity(userId, 'chunk_duel', elapsed, 'chunk-duel', [
        'grammar',
        'vocabulary',
      ], { hits: state.hits, misses: state.misses, slug: 'reorder_words' })
    }
  }, [state.status, state.hits, state.misses, userId, isGuest])

  const pickTile = useCallback((tileId: string) => {
    dispatch({ type: 'pick_tile', tileId })
  }, [])

  const nextRound = useCallback(() => {
    if (currentRoundIndexRef.current >= totalRounds) {
      dispatch({ type: 'finish' })
      return
    }
    currentRoundIndexRef.current += 1
    startNextRound()
  }, [startNextRound])

  return {
    state,
    isPlaying,
    startGame,
    pickTile,
    nextRound,
  }
}
