'use client'

import { useEffect, useRef, useState } from 'react'
import { attemptGrade, gradeToLegacyQuality, type AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { GradeExtras } from '@/lib/essential-words/grade'
import type { PendingAttempt } from './EssentialWordsImmersivePhase'

/** Bridges card AttemptOutcome → legacy numeric submitGrade, with a continue gate. */
export function useSessionAttemptBridge(
  currentStepId: string | null,
  submitGrade: (
    quality: number,
    extras?: GradeExtras,
    expectedStepId?: string,
    outcome?: AttemptOutcome,
  ) => Promise<void>,
) {
  const [pendingAttempt, setPendingAttempt] = useState<PendingAttempt | null>(null)
  const [isContinuing, setIsContinuing] = useState(false)
  const pendingAttemptRef = useRef<PendingAttempt | null>(null)
  const currentStepIdRef = useRef<string | null>(currentStepId)
  const continuingRef = useRef(false)
  currentStepIdRef.current = currentStepId

  const handleAttempt = async (outcome: AttemptOutcome) => {
    const attemptStepId = currentStepId
    if (!attemptStepId || attemptStepId !== currentStepIdRef.current) return
    if (pendingAttemptRef.current?.stepId === attemptStepId) return
    const nextPendingAttempt = { stepId: attemptStepId, outcome }
    pendingAttemptRef.current = nextPendingAttempt
    setPendingAttempt(nextPendingAttempt)
  }

  const handleSpeakAttempt = async (outcome: AttemptOutcome) => {
    const attemptStepId = currentStepId
    if (!attemptStepId || attemptStepId !== currentStepIdRef.current) return
    const grade = attemptGrade(outcome)
    const quality = gradeToLegacyQuality(grade)
    await submitGrade(quality, undefined, attemptStepId, outcome)
  }

  const clearPendingAttempt = () => {
    pendingAttemptRef.current = null
    setPendingAttempt(null)
  }

  useEffect(() => {
    const pending = pendingAttemptRef.current
    if (!pending || pending.stepId === currentStepId) return
    pendingAttemptRef.current = null
    setPendingAttempt(null)
    continuingRef.current = false
    setIsContinuing(false)
  }, [currentStepId])

  const handleContinue = async () => {
    const pending = pendingAttemptRef.current
    if (!pending || pending.stepId !== currentStepIdRef.current || continuingRef.current) return
    continuingRef.current = true
    setIsContinuing(true)
    try {
      const grade = attemptGrade(pending.outcome)
      await submitGrade(gradeToLegacyQuality(grade), undefined, pending.stepId, pending.outcome)
      if (pendingAttemptRef.current?.stepId === pending.stepId) {
        pendingAttemptRef.current = null
        setPendingAttempt(null)
      }
    } catch (error) {
      console.error('[EssentialWordsSession] failed to continue', error)
    } finally {
      continuingRef.current = false
      setIsContinuing(false)
    }
  }

  return {
    pendingAttempt,
    isContinuing,
    handleAttempt,
    handleSpeakAttempt,
    clearPendingAttempt,
    handleContinue,
  }
}
