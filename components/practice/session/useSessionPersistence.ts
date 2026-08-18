'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { buildSession } from '@/lib/practice/engine'
import {
  createSession,
  evictExpiredSessions,
  loadActiveSession,
} from '@/lib/practice/session-store'
import type { ExerciseResult, PracticeConfig, PracticeExercise } from '@/lib/practice/types'
import type { SessionPhase } from './session-state-helpers'

/** Restore (or create) a persisted practice session on mount. */
export function useSessionPersistenceRestore(
  config: PracticeConfig,
  persistence: PracticeConfig['persistence'],
) {
  const [ready, setReady] = useState(!persistence)
  const [exercises, setExercises] = useState<PracticeExercise[]>(() =>
    persistence ? [] : buildSession(config),
  )
  const [currentIndex, setCurrentIndex] = useState(config.initialIndex ?? 0)
  const [results, setResults] = useState<ExerciseResult[]>([])
  const [phase, setPhase] = useState<SessionPhase>('exercising')

  useEffect(() => {
    if (!persistence) return
    let cancelled = false
    ;(async () => {
      try {
        await evictExpiredSessions()
        const existing = await loadActiveSession(persistence.userId, persistence.soundId)
        if (cancelled) return
        if (existing && existing.exercises.length > 0) {
          setExercises(existing.exercises)
          setCurrentIndex(existing.currentIndex)
          setResults(existing.answers)
          setPhase(existing.currentIndex >= existing.exercises.length ? 'complete' : 'exercising')
        } else {
          const fresh = buildSession(config)
          setExercises(fresh)
          setCurrentIndex(0)
          setResults([])
          setPhase(fresh.length > 0 ? 'exercising' : 'complete')
          if (fresh.length > 0) {
            await createSession({
              userId: persistence.userId,
              soundId: persistence.soundId,
              exercises: fresh,
            })
          }
        }
      } catch (err) {
        console.error('[PracticeSession] restore failed; starting fresh', err)
        const fresh = buildSession(config)
        if (!cancelled) {
          setExercises(fresh)
          setPhase(fresh.length > 0 ? 'exercising' : 'complete')
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [persistence?.userId, persistence?.soundId])

  return {
    ready,
    exercises,
    setExercises,
    currentIndex,
    setCurrentIndex,
    results,
    setResults,
    phase,
    setPhase,
  }
}

export function useSessionTimers(
  phase: SessionPhase,
  currentIndex: number,
) {
  const startTimeRef = useRef<number>(Date.now())
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (phase === 'exercising') startTimeRef.current = Date.now()
  }, [phase, currentIndex])

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    },
    [],
  )

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
  }, [])

  return { startTimeRef, feedbackTimerRef, clearFeedbackTimer }
}
