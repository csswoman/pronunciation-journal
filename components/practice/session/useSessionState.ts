'use client'

// Hook that owns all mutable session state and callbacks for PracticeSession.
// PracticeSession imports this and stays purely compositional.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { buildSession } from '@/lib/practice/engine'
import { savePracticeAnswer } from '@/lib/practice/queries'
import { buildSessionResult } from '@/lib/practice/session-result'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import { gradeEssentialWord } from '@/lib/essential-words/grade'
import { flushOutbox } from '@/lib/sync/sync-manager'
import { createSession, deleteSession, updateSessionProgress } from '@/lib/practice/session-store'
import type { ExerciseResult, PracticeConfig } from '@/lib/practice/types'
import { useVoiceRotation } from '@/hooks/useVoiceRotation'
import { playUiCue } from '@/lib/ui-sounds/cues'
import {
  buildExerciseResult,
  FEEDBACK_MS,
  type ProgressSaveStatus,
} from './session-state-helpers'
import { useSessionPersistenceRestore, useSessionTimers } from './useSessionPersistence'

export { buildSessionResult } from '@/lib/practice/session-result'

export function useSessionState(config: PracticeConfig) {
  const { user } = useAuth()
  const { context, onSessionComplete, onExit, persistence } = config

  const {
    ready,
    exercises,
    setExercises,
    currentIndex,
    setCurrentIndex,
    results,
    setResults,
    phase,
    setPhase,
  } = useSessionPersistenceRestore(config, persistence)

  const [lastFeedback, setLastFeedback] = useState<boolean | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [progressSaveStatus, setProgressSaveStatus] = useState<ProgressSaveStatus>('idle')
  const { currentVoice, nextVoice } = useVoiceRotation()
  const { startTimeRef, feedbackTimerRef, clearFeedbackTimer } = useSessionTimers(phase, currentIndex)
  const completedRef = useRef(false)
  const submittingRef = useRef(false)

  const finish = useCallback((final: ExerciseResult[]) => {
    void final
    setPhase('complete')
  }, [setPhase])

  const drainOutbox = useCallback(async (userId: string) => {
    try {
      const flushResult = await flushOutbox(userId)
      setProgressSaveStatus((prev) => {
        if (prev === 'error') return prev
        return flushResult.failed === 0 && flushResult.skipped === 0 ? 'synced' : 'saved_local'
      })
    } catch (err) {
      console.error('[PracticeSession] flushOutbox failed', err)
      setProgressSaveStatus('error')
    }
  }, [])

  const handleRetrySync = useCallback(() => {
    if (!user) return
    setProgressSaveStatus('saving')
    void drainOutbox(user.id)
  }, [user, drainOutbox])

  useEffect(() => {
    if (phase !== 'complete' || completedRef.current) return
    completedRef.current = true
    const sessionResult = buildSessionResult(results)
    onSessionComplete(sessionResult)
    if (user) {
      setProgressSaveStatus((prev) => (prev === 'error' ? prev : 'saving'))
      void (async () => {
        try {
          await recordActivitySession(user.id, { practiceContext: context, sessionResult })
          await drainOutbox(user.id)
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
  }, [phase, results, onSessionComplete, persistence, user, context, drainOutbox])

  const handleSubmit = useCallback(
    async (
      isCorrect: boolean,
      userAnswer: string,
      extras?: import('@/lib/practice/types').PracticeSubmitExtras,
    ) => {
      const current = exercises[currentIndex]
      if (!current || phase !== 'exercising' || submittingRef.current) return
      submittingRef.current = true
      const totalInteractionMs = Date.now() - startTimeRef.current
      const responseTimeMs = extras?.responseTimeMs ?? totalInteractionMs

      const result = buildExerciseResult({
        current,
        isCorrect,
        userAnswer,
        timeMs: responseTimeMs,
        context,
        extras: {
          ...extras,
          responseTimeMs,
          totalInteractionMs,
        },
      })
      if (user) {
        try {
          await savePracticeAnswer(user.id, result)
        } catch (err) {
          console.error('[PracticeSession] savePracticeAnswer failed', err)
          setProgressSaveStatus('error')
        }
      }
      const isAnswered = result.status === 'answered' || (result.status === undefined && result.userAnswer !== 'skip')
      if (result.sourceRef?.source === 'core1k' && isAnswered) {
        const word = result.sourceRef.id.replace(/^c1k:/, '')
        const gradeVal = result.isCorrect ? (result.firstTryFailed ? 3 : 4) : 2
        void gradeEssentialWord(word, gradeVal, {}, user?.id).catch((err) => {
          console.error('[PracticeSession] gradeEssentialWord failed', err)
        })
      }
      const nextResults = [...results, result]
      const nextIndex = currentIndex + 1
      setResults(nextResults)
      setLastFeedback(isCorrect)
      if (current.payload.kind === 'phoneme') playUiCue(isCorrect ? 'correct' : 'wrong')
      try {
        if (!isCorrect && current.payload.kind === 'phoneme' && userAnswer !== 'skip') {
          setPhase('hints')
          return
        }
        setPhase('feedback')
        if (persistence) {
          void updateSessionProgress(persistence.userId, persistence.soundId, {
            currentIndex: nextIndex,
            answers: nextResults,
          }).catch((err) => {
            console.error('[PracticeSession] updateSessionProgress failed', err)
          })
        }
        nextVoice()
        feedbackTimerRef.current = setTimeout(() => {
          if (nextIndex >= exercises.length) finish(nextResults)
          else {
            setCurrentIndex(nextIndex)
            setLastFeedback(null)
            setPhase('exercising')
          }
        }, FEEDBACK_MS)
      } finally {
        submittingRef.current = false
      }
    },
    [
      exercises,
      currentIndex,
      phase,
      results,
      user,
      context,
      persistence,
      nextVoice,
      finish,
      startTimeRef,
      feedbackTimerRef,
      setResults,
      setCurrentIndex,
      setPhase,
    ],
  )

  const handleRetry = useCallback(() => {
    setRetryKey((k) => k + 1)
    setLastFeedback(null)
    setPhase('exercising')
  }, [setPhase])

  const handleHintContinue = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (nextIndex >= exercises.length) finish(results)
    else {
      setCurrentIndex(nextIndex)
      setLastFeedback(null)
      setPhase('exercising')
    }
  }, [currentIndex, exercises.length, finish, results, setCurrentIndex, setPhase])

  const handlePracticeAgain = useCallback(() => {
    clearFeedbackTimer()
    const fresh = buildSession(config)
    completedRef.current = false
    setProgressSaveStatus('idle')
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
  }, [
    config,
    persistence,
    clearFeedbackTimer,
    setExercises,
    setCurrentIndex,
    setResults,
    setPhase,
  ])

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
    handleRetrySync,
    handleHintContinue,
    handlePracticeAgain,
  }
}
