'use client'

// Planned structure:
// <PracticeSession>
//   <SessionLoadingShell />    (while restoring persisted session)
//   <SessionSummary />         (on completion)
//   <SessionExercisingBody />  (active exercise flow)
// </PracticeSession>

import { useEffect, useMemo, useRef } from 'react'
import type { PracticeConfig, PracticeExercise } from '@/lib/practice/types'
import { PhonemeFocusShell } from '@/components/phoneme-practice/PhonemeFocusShell'
import { useHideMobileNavDuringSession } from '@/hooks/useHideMobileNavDuringSession'
import { SessionLoadingShell } from './session/SessionLoadingShell'
import { SessionExercisingBody } from './session/SessionExercisingBody'
import { SessionSummary } from './session/SessionSummary'
import { useSessionState, buildSessionResult } from './session/useSessionState'
import { formatIpaDisplay, resolveSessionIpa } from '@/lib/practice/resolve-session-ipa'
import { playUiCue } from '@/lib/ui-sounds/cues'

type Phase = 'exercising' | 'feedback' | 'hints' | 'complete'

function badgeForExercise(
  ex: PracticeExercise | undefined,
  sessionIpa: string | undefined,
  focusBadge: string | undefined,
): string | undefined {
  if (sessionIpa) return formatIpaDisplay(sessionIpa)
  if (!focusBadge) return undefined
  if (ex?.payload.kind === 'phoneme' && ex.payload.ipa.trim()) {
    return formatIpaDisplay(ex.payload.ipa)
  }
  return focusBadge
}

function playSessionCompleteCue(accuracy: number): void {
  if (accuracy >= 85) playUiCue('correct')
  else if (accuracy >= 60) playUiCue('reveal')
  else playUiCue('soft')
}

export default function PracticeSession(config: PracticeConfig) {
  const { soundIpa, sessionLabel, context, onExit, footer } = config
  useHideMobileNavDuringSession()
  const focusBadge = soundIpa ?? sessionLabel
  const focusUi =
    Boolean(focusBadge) &&
    (context === 'sound_lab' ||
      context === 'daily' ||
      context === 'practice' ||
      context === 'review')

  const {
    ready,
    exercises,
    currentIndex,
    results,
    phase,
    lastFeedback,
    retryKey,
    currentVoice,
    sessionResult,
    progressSaveStatus,
    handleSubmit,
    handleRetry,
    handleRetrySync,
    handleHintContinue,
    handlePracticeAgain,
  } = useSessionState(config)

  const sessionIpa = useMemo(
    () => resolveSessionIpa(soundIpa, exercises),
    [soundIpa, exercises],
  )

  const completionCuePlayed = useRef(false)
  useEffect(() => {
    if (phase !== 'complete') {
      completionCuePlayed.current = false
      return
    }
    if (completionCuePlayed.current) return
    completionCuePlayed.current = true
    playSessionCompleteCue(sessionResult.accuracy)
  }, [phase, sessionResult.accuracy])

  const current = exercises[currentIndex]
  const displayBadge =
    badgeForExercise(current, sessionIpa, focusBadge) ?? sessionIpa ?? focusBadge ?? ''
  const shellBadge = sessionIpa ? formatIpaDisplay(sessionIpa) : displayBadge || undefined

  if (!ready) {
    return (
      <SessionLoadingShell
        focusUi={focusUi}
        displayBadge={shellBadge ?? displayBadge}
        onExit={() => onExit?.(buildSessionResult([]))}
      />
    )
  }

  if (exercises.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto p-8 text-center text-fg-secondary text-sm">
        No exercises available.
      </div>
    )
  }

  const progressPct = Math.min(
    100,
    Math.round(
      (Math.min(currentIndex + (phase === 'feedback' ? 1 : 0), exercises.length) /
        Math.max(exercises.length, 1)) *
        100,
    ),
  )

  if (phase === 'complete') {
    const summary = (
      <SessionSummary
        result={sessionResult}
        practiceIpa={sessionIpa}
        progressSaveStatus={progressSaveStatus}
        onRetrySync={handleRetrySync}
        onPracticeAgain={handlePracticeAgain}
        onFinish={() => onExit?.(sessionResult)}
      />
    )
    if (focusUi && (shellBadge || displayBadge)) {
      return (
        <PhonemeFocusShell
          badge={shellBadge}
          progressPct={100}
          onExit={() => onExit?.(sessionResult)}
        >
          <div className="phoneme-focus__summary">{summary}</div>
        </PhonemeFocusShell>
      )
    }
    return (
      <div className="mx-auto w-full max-w-md p-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] lg:pb-6">
        {summary}
      </div>
    )
  }

  return (
    <SessionExercisingBody
      lessonFooter={footer}
      state={{
        focusUi,
        displayBadge: shellBadge ?? displayBadge,
        progressPct,
        phase: phase as Exclude<Phase, 'complete'>,
        current,
        currentIndex,
        totalExercises: exercises.length,
        retryKey,
        lastFeedback,
        currentVoice,
        results,
      }}
      handlers={{
        onSubmit: handleSubmit,
        onRetry: handleRetry,
        onHintContinue: handleHintContinue,
        onExit: (result) => onExit?.(result),
      }}
    />
  )
}
