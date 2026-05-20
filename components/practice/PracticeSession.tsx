'use client'

// Planned structure:
// <PracticeSession>
//   <SessionProgress />
//   <ExerciseRenderer />           // dispatches on slug
//   <InlineFeedback />             // shown briefly between exercises
//   <SessionSummary />             // shown on completion
// </PracticeSession>

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
import { ExerciseRenderer } from './session/ExerciseRenderer'
import { SessionProgress } from './session/SessionProgress'
import { InlineFeedback } from './session/InlineFeedback'
import { SessionSummary } from './session/SessionSummary'

const FEEDBACK_MS = 1500

type Phase = 'exercising' | 'feedback' | 'complete'

function emptyBySlug(): SessionResult['bySlug'] {
  // Cast empty object to the Record shape — entries are added on demand.
  return {} as SessionResult['bySlug']
}

function buildSessionResult(results: ExerciseResult[]): SessionResult {
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

export default function PracticeSession(config: PracticeConfig) {
  const { user } = useAuth()
  const { context, onSessionComplete, onExit, persistence } = config

  // Until Dexie restore finishes, render nothing rather than briefly showing
  // a fresh-session that flickers when the persisted one loads. `ready` flips
  // to true once we know whether to resume or start fresh.
  const [ready, setReady] = useState(!persistence)
  const [exercises, setExercises] = useState<PracticeExercise[]>(() =>
    persistence ? [] : buildSession(config),
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<ExerciseResult[]>([])
  const [phase, setPhase] = useState<Phase>('exercising')
  const [lastFeedback, setLastFeedback] = useState<boolean | null>(null)

  const startTimeRef = useRef<number>(Date.now())
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    // Only re-run if the persistence target changes; config.exercises identity
    // is intentionally NOT tracked — we rebuild via buildSession(config) above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistence?.userId, persistence?.soundId])

  // Reset start time whenever a new exercise is shown.
  useEffect(() => {
    if (phase === 'exercising') startTimeRef.current = Date.now()
  }, [phase, currentIndex])

  // Cleanup feedback timer on unmount.
  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    },
    [],
  )

  const current = exercises[currentIndex]

  const finish = useCallback((final: ExerciseResult[]) => {
    // onSessionComplete runs exactly once via the effect below that watches `phase`.
    void final
    setPhase('complete')
  }, [])

  // Fire onSessionComplete exactly once when the session transitions to `complete`.
  const completedRef = useRef(false)
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
        exercisePayload:
          current.payload.kind === 'phoneme'
            ? {
                type: current.slug,
                soundId: current.soundId,
                options: current.payload.options,
                targetWord: current.payload.targetWord,
              }
            : { type: current.slug, contentId: current.contentId },
        completedAt: new Date(),
      }

      // Fire-and-forget persistence; never await in the render path.
      if (user) {
        void savePracticeAnswer(user.id, result).catch((err) => {
          console.error('[PracticeSession] savePracticeAnswer failed', err)
        })
      }

      const nextResults = [...results, result]
      const nextIndex = currentIndex + 1
      setResults(nextResults)
      setLastFeedback(isCorrect)
      setPhase('feedback')

      // Persist progress so a reload/new-window resumes exactly here.
      if (persistence) {
        void updateSessionProgress(persistence.userId, persistence.soundId, {
          currentIndex: nextIndex,
          answers: nextResults,
        }).catch((err) => {
          console.error('[PracticeSession] updateSessionProgress failed', err)
        })
      }

      feedbackTimerRef.current = setTimeout(() => {
        if (nextIndex >= exercises.length) {
          finish(nextResults)
        } else {
          setCurrentIndex(nextIndex)
          setLastFeedback(null)
          setPhase('exercising')
        }
      }, FEEDBACK_MS)
    },
    [current, phase, results, currentIndex, exercises.length, user, context, finish, persistence],
  )

  const handlePracticeAgain = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    const fresh = buildSession(config)
    completedRef.current = false
    setExercises(fresh)
    setCurrentIndex(0)
    setResults([])
    setLastFeedback(null)
    setPhase(fresh.length > 0 ? 'exercising' : 'complete')
    if (persistence && fresh.length > 0) {
      void createSession({
        userId: persistence.userId,
        soundId: persistence.soundId,
        exercises: fresh,
      }).catch((err) => {
        console.error('[PracticeSession] createSession (restart) failed', err)
      })
    }
  }, [config, persistence])

  const sessionResult = useMemo(
    () => buildSessionResult(results),
    [results],
  )

  if (!ready) {
    return (
      <div className="w-full max-w-md mx-auto p-6 text-center text-fg-subtle">
        <span className="animate-pulse">Loading…</span>
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto p-6 text-center text-fg-muted">
        No exercises available.
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <SessionSummary
          result={sessionResult}
          onPracticeAgain={handlePracticeAgain}
          onFinish={() => onExit?.(sessionResult)}
        />
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-5 p-4">
      <SessionProgress current={currentIndex} total={exercises.length} />

      {current && (phase === 'exercising' || phase === 'feedback') && (
        <ExerciseRenderer
          key={current.id}
          exercise={current}
          onSubmit={handleSubmit}
        />
      )}

      {phase === 'feedback' && lastFeedback !== null && (
        <InlineFeedback isCorrect={lastFeedback} />
      )}
    </div>
  )
}
