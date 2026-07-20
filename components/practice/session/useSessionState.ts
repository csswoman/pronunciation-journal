'use client'

// Hook that owns all mutable session state and callbacks for PracticeSession.
// PracticeSession imports this and stays purely compositional.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { buildSession } from '@/lib/practice/engine'
import { savePracticeAnswer } from '@/lib/practice/queries'
import { buildSessionResult } from '@/lib/practice/session-result'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import { gradeCore1000Word } from '@/lib/core-1000/grade'
import { flushOutbox } from '@/lib/sync/sync-manager'
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
} from '@/lib/practice/types'
import { useVoiceRotation } from '@/hooks/useVoiceRotation'
import { playUiCue } from '@/lib/ui-sounds/cues'

const FEEDBACK_MS = 1500

type Phase = 'exercising' | 'feedback' | 'hints' | 'complete'
type ProgressSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export { buildSessionResult } from '@/lib/practice/session-result'

export function useSessionState(config: PracticeConfig) {
  const { user } = useAuth()
  const { context, onSessionComplete, onExit, persistence } = config

  const [ready, setReady] = useState(!persistence)
  const [exercises, setExercises] = useState<PracticeExercise[]>(() =>
    persistence ? [] : buildSession(config),
  )
  const [currentIndex, setCurrentIndex] = useState(config.initialIndex ?? 0)
  const [results, setResults] = useState<ExerciseResult[]>([])
  const [phase, setPhase] = useState<Phase>('exercising')
  const [lastFeedback, setLastFeedback] = useState<boolean | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [progressSaveStatus, setProgressSaveStatus] = useState<ProgressSaveStatus>('idle')

  const { currentVoice, nextVoice } = useVoiceRotation()

  const startTimeRef = useRef<number>(Date.now())
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completedRef = useRef(false)
  const submittingRef = useRef(false)

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
    const sessionResult = buildSessionResult(results)
    onSessionComplete(sessionResult)
    if (user) {
      setProgressSaveStatus('saving')
      void (async () => {
        try {
          await recordActivitySession(user.id, { practiceContext: context, sessionResult })
          await flushOutbox(user.id)
          setProgressSaveStatus('saved')
        } catch (err) {
          console.error('[PracticeSession] recordActivitySession failed', err)
          setProgressSaveStatus('error')
        }
      })()
    }
    if (persistence) {
      void deleteSession(persistence.userId, persistence.soundId).catch((err) => {
        console.error('[PracticeSession] deleteSession failed', err)
      })
    }
  }, [phase, results, onSessionComplete, persistence, user, context])

  const handleSubmit = useCallback(
    async (isCorrect: boolean, userAnswer: string, extras?: { score?: number; feedback?: import('@/lib/practice/types').PedagogicalFeedback }) => {
      const current = exercises[currentIndex]
      if (!current || phase !== 'exercising' || submittingRef.current) return
      submittingRef.current = true
      const timeMs = Date.now() - startTimeRef.current
      const result: ExerciseResult = {
        exerciseId: current.id,
        slug: current.slug,
        exerciseTypeId: current.exerciseTypeId,
        isCorrect,
        userAnswer,
        timeMs,
        score: extras?.score,
        feedback: extras?.feedback,
        contentId: current.contentId,
        context,
        soundId: current.soundId,
        sourceRef: current.sourceRef,
        topic: current.payload.kind === 'generic' ? current.payload.data.topic : undefined,
        exercisePayload:
          current.payload.kind === 'phoneme'
            ? { type: current.slug, soundId: current.soundId, options: current.payload.options, targetWord: current.payload.targetWord }
            : {
                type: current.slug,
                contentId: current.contentId,
                feedbackCategory: extras?.feedback?.category,
                errorCode: extras?.feedback?.errorCode,
                expectedAnswer: extras?.feedback?.expectedAnswer,
                hintUsed: extras?.feedback?.category?.includes('hint_used') || undefined,
                nextAction: extras?.feedback?.nextAction,
              },
        completedAt: new Date(),
      }
      if (user) {
        try {
          await savePracticeAnswer(user.id, result)
        } catch (err) {
          console.error('[PracticeSession] savePracticeAnswer failed', err)
          setProgressSaveStatus('error')
        }
      }
      // Route vocab exercises from courses to the shared Core 1000 SRS entry.
      if (result.sourceRef?.source === 'core1k') {
        const word = result.sourceRef.id.replace(/^c1k:/, '')
        const quality = result.isCorrect ? 4 : 2
        // answer_history is already written above; userId scopes only the local SRS mirror.
        void gradeCore1000Word(word, quality, {}, user?.id).catch((err) => {
          console.error('[PracticeSession] gradeCore1000Word failed', err)
        })
      }
      const nextResults = [...results, result]
      const nextIndex = currentIndex + 1
      setResults(nextResults)
      setLastFeedback(isCorrect)
      if (current.payload.kind === 'phoneme') {
        playUiCue(isCorrect ? 'correct' : 'wrong')
      }
      try {
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
      } finally {
        submittingRef.current = false
      }
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
    setProgressSaveStatus('idle')
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
    progressSaveStatus,
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
