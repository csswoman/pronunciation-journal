'use client'

// Hook that owns all mutable session state and callbacks for PracticeSession.
// PracticeSession imports this and stays purely compositional.

import { useCallback, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { buildSession } from '@/lib/practice/engine'
import { savePracticeAnswer } from '@/lib/practice/queries'
import { buildSessionResult } from '@/lib/practice/session-result'
import { gradeEssentialWord } from '@/lib/essential-words/grade'
import { flushOutbox } from '@/lib/sync/sync-manager'
import { createSession, updateSessionProgress } from '@/lib/practice/session-store'
import type { ExerciseResult, PracticeConfig } from '@/lib/practice/types'
import { useVoiceRotation } from '@/hooks/useVoiceRotation'
import { playUiCue } from '@/lib/ui-sounds/cues'
import {
  buildExerciseResult,
  FEEDBACK_MS,
  type ProgressSaveStatus,
} from './session-state-helpers'
import { useSessionPersistenceRestore, useSessionTimers } from './useSessionPersistence'

import { useSessionCompletion } from './useSessionCompletion'

export { buildSessionResult } from '@/lib/practice/session-result'

export function useSessionState(config: PracticeConfig) {
  const { user } = useAuth()
  const { context, onExit, persistence } = config

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
    sessionIdRef,
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

  useSessionCompletion({ phase, results, config, user, completedRef, sessionIdRef, drainOutbox, setProgressSaveStatus })

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

      const attemptId = `${sessionIdRef.current}:${currentIndex}:${current.id}`
      const previous = results.find((entry) => entry.attemptId === attemptId)
      const result = buildExerciseResult({
        current,
        isCorrect,
        userAnswer,
        timeMs: responseTimeMs,
        context,
        attemptId,
        extras: {
          ...extras,
          attemptId,
          responseTimeMs,
          totalInteractionMs,
          firstTryFailed: previous ? !previous.isCorrect || previous.firstTryFailed : extras?.firstTryFailed,
        },
      })
      if (user && !previous) {
        try {
          await savePracticeAnswer(user.id, result)
        } catch (err) {
          console.error('[PracticeSession] savePracticeAnswer failed', err)
          setProgressSaveStatus('error')
        }
      }
      const isAnswered = result.status === 'answered' || (result.status === undefined && result.userAnswer !== 'skip')
      if (!previous && result.sourceRef?.source === 'core1k' && isAnswered) {
        const word = result.sourceRef.id.replace(/^c1k:/, '')
        const gradeVal = result.isCorrect ? (result.firstTryFailed ? 3 : 4) : 2
        void gradeEssentialWord(word, gradeVal, {}, user?.id).catch((err) => {
          console.error('[PracticeSession] gradeEssentialWord failed', err)
        })
      }
      const nextResults = previous ? results : [...results, result]
      const nextIndex = currentIndex + 1
      setResults(nextResults)
      setLastFeedback(isCorrect)
      if (current.payload.kind === 'phoneme') playUiCue(isCorrect ? 'correct' : 'wrong')
      try {
        if (!isCorrect && current.payload.kind === 'phoneme' && userAnswer !== 'skip') {
          if (persistence) await updateSessionProgress(persistence.userId, persistence.soundId, {
            currentIndex, answers: nextResults, phase: 'hints',
          })
          setPhase('hints')
          return
        }
        setPhase('feedback')
        if (persistence) {
          void updateSessionProgress(persistence.userId, persistence.soundId, {
            currentIndex: nextIndex,
            answers: nextResults,
            phase: 'exercising',
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
      sessionIdRef,
    ],
  )

  const handleRetry = useCallback(() => {
    setRetryKey((k) => k + 1)
    setLastFeedback(null)
    setPhase('exercising')
  }, [setPhase])

  const handleHintContinue = useCallback(() => {
    const nextIndex = currentIndex + 1
    if (persistence) void updateSessionProgress(persistence.userId, persistence.soundId, {
      currentIndex: nextIndex, answers: results, phase: 'exercising',
    }).catch(() => setProgressSaveStatus('error'))
    if (nextIndex >= exercises.length) finish(results)
    else {
      setCurrentIndex(nextIndex)
      setLastFeedback(null)
      setPhase('exercising')
    }
  }, [currentIndex, exercises.length, finish, results, setCurrentIndex, setPhase, persistence])

  const handlePracticeAgain = useCallback(() => {
    clearFeedbackTimer()
    const fresh = buildSession(config)
    completedRef.current = false
    sessionIdRef.current = crypto.randomUUID()
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
        sessionId: sessionIdRef.current,
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
    sessionIdRef,
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
