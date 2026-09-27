'use client'

import { useEffect, type RefObject, type Dispatch, type SetStateAction } from 'react'
import { buildSessionResult } from '@/lib/practice/session-result'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import { deleteSession } from '@/lib/practice/session-store'
import type { ExerciseResult, PracticeConfig } from '@/lib/practice/types'
import type { ProgressSaveStatus, SessionPhase } from './session-state-helpers'

export function useSessionCompletion({ phase, results, config, user, completedRef, sessionIdRef, drainOutbox, setProgressSaveStatus }: {
  phase: SessionPhase
  results: ExerciseResult[]
  config: PracticeConfig
  user: { id: string } | null
  completedRef: RefObject<boolean>
  sessionIdRef: RefObject<string>
  drainOutbox: (userId: string) => Promise<void>
  setProgressSaveStatus: Dispatch<SetStateAction<ProgressSaveStatus>>
}) {
  const { onSessionComplete, persistence, context } = config
  useEffect(() => {
    if (phase !== 'complete' || completedRef.current) return
    completedRef.current = true
    const sessionResult = buildSessionResult(results, sessionIdRef.current)
    onSessionComplete(sessionResult)
    if (user) {
      setProgressSaveStatus((prev) => (prev === 'error' ? prev : 'saving'))
      void (async () => {
        try {
          await recordActivitySession(user.id, {
            practiceContext: context,
            sessionResult,
            activitySessionId: sessionIdRef.current,
          })
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
  }, [phase, results, onSessionComplete, persistence, user, context, drainOutbox, completedRef, sessionIdRef, setProgressSaveStatus])

}
