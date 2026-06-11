'use client'

// Hook that owns all mutable session state and callbacks for PracticeSession.
// PracticeSession imports this and stays purely compositional.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { buildSession } from '@/lib/practice/engine'
import { savePracticeAnswer } from '@/lib/practice/queries'
import {
  createSession,
  deleteSession,
  evictExpiredSessions,
  loadActiveSession,
  updateSessionProgress,
} from '@/lib/practice/session-store'
import type {
  ExerciseResult,
  PracticeConfig,
  PracticeExercise,
  SessionResult,
} from '@/lib/practice/types'
import { useVoiceRotation } from '@/hooks/useVoiceRotation'

const FEEDBACK_MS = 1500

type Phase = 'exercising' | 'feedback' | 'hints' | 'complete'

function emptyBySlug(): SessionResult['bySlug'] {
  // Cast empty object to the Record shape — entries are added on demand.
  return {} as SessionResult['bySlug']
}

export function buildSessionResult(results: ExerciseResult[]): SessionResult {
  const total = results.length
  const correct = results.filter((r) => r.isCorrect).length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const totalTimeMs = results.reduce((acc, r) => acc + r.timeMs, 0)
  const bySlug = emptyBySlug()
  for (const r of results) {
    const entry = bySlug[r.slug] ?? { total: 0, correct: 0 }
    entry.total += 1
    if (r.isCorrect) entry.correct += 1
    bySlug[r.slug] = entry
  }
  return { results, accuracy, totalTimeMs, bySlug }
}

export function useSessionState(config: PracticeConfig) {
  const { user } = useAuth()
  const { context, onSessionComplete, onExit, persistence } = config

  const [ready, setReady] = useState(!persistence)
  const [exercises, setExercises] = useState<PracticeExercise[]>(() =>
    persistence ? [] : buildSession(config),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<ExerciseResult[]>([])
  const [phase, setPhase] = useState<Phase>('exercising')
  const [lastFeedback, setLastFeedback] = useState<boolean | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  const { currentVoice, nextVoice } = useVoiceRotation()

  const startTimeRef = useRef<number>(Date.now())
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completedRef = useRef(false)

  // Restore (or create) the persisted session on mount.
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
            await createSession({ userId: persistence.userId, soundId: persistence.soundId, exercises: fresh })
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
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistence?.userId, persistence?.soundId])

  // Reset start time whenever a new exercise is shown.
  useEffect(() => {
    if (phase === 'exercising') startTimeRef.current = Date.now()
  }, [phase, currentIndex])

  // Cleanup feedback timer on unmount.
  useEffect(() => () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current) }, [])

  const finish = useCallback((final: ExerciseResult[]) => { void final; setPhase('complete') }, [])

  // Fire onSessionComplete exactly once when the session transitions to `complete`.
  useEffect(() => {
    if (phase !== 'complete' || completedRef.current) return
    completedRef.current = true
    onSessionComplete(buildSessionResult(results))
    if (persistence) {
      void deleteSession(persistence.userId, persistence.soundId).catch((err) => {
        console.error('[PracticeSession] deleteSession failed', err)
      })
    }
  }, [phase, results, onSessionComplete, persistence])

  const handleSubmit = useCallback(
    (isCorrect: boolean, userAnswer: string) => {
      const current = exercises[currentIndex]
      if (!current || phase !== 'exercising') return
      const timeMs = Date.now() - startTimeRef.current
      const result: ExerciseResult = {
        exerciseId: current.id,
        slug: current.slug,
        exerciseTypeId: current.exerciseTypeId,
        isCorrect,
        userAnswer,
        timeMs,
        contentId: current.contentId,
        context,
        soundId: current.soundId,
        sourceRef: current.sourceRef,
        exercisePayload:
          current.payload.kind === 'phoneme'
            ? { type: current.slug, soundId: current.soundId, options: current.payload.options, targetWord: current.payload.targetWord }
            : { type: current.slug, contentId: current.contentId },
        completedAt: new Date(),
      }
      if (user) {
        void savePracticeAnswer(user.id, result).catch((err) => {
          console.error('[PracticeSession] savePracticeAnswer failed', err)
        })
      }
      const nextResults = [...results, result]
      const nextIndex = currentIndex + 1
      setResults(nextResults)
      setLastFeedback(isCorrect)
      if (!isCorrect && current.payload.kind === 'phoneme' && userAnswer !== 'skip') {
        setPhase('hints')
        return
      }
      setPhase('feedback')
      if (persistence) {
        void updateSessionProgress(persistence.userId, persistence.soundId, { currentIndex: nextIndex, answers: nextResults }).catch((err) => {
          console.error('[PracticeSession] updateSessionProgress failed', err)
        })
      }
      nextVoice()
      feedbackTimerRef.current = setTimeout(() => {
        if (nextIndex >= exercises.length) { finish(nextResults) }
        else { setCurrentIndex(nextIndex); setLastFeedback(null); setPhase('exercising') }
      }, FEEDBACK_MS)
    },
    [exercises, currentIndex, phase, results, user, context, persistence, nextVoice, finish],
  )

  const handleRetry = useCallback(() => {
    setRetryKey((k) => k + 1); setLastFeedback(null); setPhase('exercising')
  }, [])

  const handleHintContinue = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= exercises.length) { finish(results) }
    else { setCurrentIndex(nextIndex); setLastFeedback(null); setPhase('exercising') }
  }, [currentIndex, exercises.length, finish, results])

  const handlePracticeAgain = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    const fresh = buildSession(config)
    completedRef.current = false
    setExercises(fresh); setCurrentIndex(0); setResults([]); setLastFeedback(null)
    setPhase(fresh.length > 0 ? 'exercising' : 'complete')
    if (persistence && fresh.length > 0) {
      void createSession({ userId: persistence.userId, soundId: persistence.soundId, exercises: fresh }).catch((err) => {
        console.error('[PracticeSession] createSession (restart) failed', err)
      })
    }
  }, [config, persistence])

  const sessionResult = useMemo(() => buildSessionResult(results), [results])

  return {
    ready,
    exercises,
    currentIndex,
    results,
    phase,
    lastFeedback,
    retryKey,
    currentVoice,
    sessionResult,
    onExit,
    handleSubmit,
    handleRetry,
    handleHintContinue,
    handlePracticeAgain,
  }
}
