'use client'

import { useReducer, useEffect, useRef, useCallback, useState } from 'react'
import {
  createInitialWeakFormState,
  weakFormReducer,
} from '@/lib/games/weak-form-catcher/engine'
import type { WeakFormPhraseItem } from '@/lib/games/weak-form-catcher/schema'
import { speak } from '@/lib/phoneme-practice/tts'
import { recordGameActivity } from '@/lib/progress/game-activity'
import { useAuth } from '@/components/auth/AuthProvider'
import { isAnonymousUser } from '@/lib/auth/is-anonymous'

export function useWeakFormCatcherLoop(phrases: WeakFormPhraseItem[]) {
  const { user } = useAuth()
  const isGuest = isAnonymousUser(user)
  const userId = user?.id ?? null
  const [state, dispatch] = useReducer(
    weakFormReducer,
    createInitialWeakFormState(),
  )
  const [isPlaying, setIsPlaying] = useState(false)

  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  const playPhraseAudio = useCallback((fullPhrase: string, slow = false) => {
    if (!fullPhrase) return
    speak(fullPhrase, { rate: slow ? 0.7 : 1.1 })
  }, [])

  const startGame = useCallback(() => {
    if (phrases.length === 0) return
    startTimeRef.current = Date.now()
    setIsPlaying(true)
    dispatch({ type: 'start', phrases })
  }, [phrases])

  // Play phrase audio when current phrase changes or hint slow changes
  useEffect(() => {
    if (isPlaying && state.status === 'playing' && state.currentPhrase) {
      playPhraseAudio(state.currentPhrase.full, state.hintSlowActive)
    }
  }, [isPlaying, state.status, state.currentPhrase, state.hintSlowActive, playPhraseAudio])

  // Tick loop
  useEffect(() => {
    if (!isPlaying || state.status !== 'playing') return

    const loop = (timestamp: number) => {
      if (!lastTickRef.current) lastTickRef.current = timestamp
      const delta = timestamp - lastTickRef.current
      lastTickRef.current = timestamp

      // Dy speed: ~10s per phrase
      const speedFactor = 0.01
      const dy = delta * speedFactor
      dispatch({ type: 'tick', dy })

      rafRef.current = requestAnimationFrame(loop)
    }

    lastTickRef.current = performance.now()
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, state.status])

  // Record activity on game over
  const recordedRef = useRef(false)
  useEffect(() => {
    if (state.status === 'game_over' && !recordedRef.current && userId && !isGuest) {
      recordedRef.current = true
      const elapsed = Date.now() - startTimeRef.current
      void recordGameActivity(userId, 'weak_form_catcher', elapsed, 'weak-form-catcher', [
        'listening',
      ])
    }
  }, [state.status, userId, isGuest])

  const submitAnswer = useCallback((text: string) => {
    dispatch({ type: 'submit', text })
  }, [])

  const useHint = useCallback((kind: 'slow' | 'first_word') => {
    dispatch({ type: 'use_hint', kind })
  }, [])

  const dismissRule = useCallback(() => {
    dispatch({ type: 'dismiss_rule' })
  }, [])

  const repeatAudio = useCallback(() => {
    if (state.currentPhrase) {
      playPhraseAudio(state.currentPhrase.full, state.hintSlowActive)
    }
  }, [state.currentPhrase, state.hintSlowActive, playPhraseAudio])

  return {
    state,
    isPlaying,
    startGame,
    submitAnswer,
    useHint,
    dismissRule,
    repeatAudio,
  }
}
