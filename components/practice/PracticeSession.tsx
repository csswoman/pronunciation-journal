'use client'

// Planned structure:
// <PracticeSession>
//   <SessionLoadingShell />    (while restoring persisted session)
//   <SessionSummary />         (on completion)
//   <SessionExercisingBody />  (active exercise flow)
// </PracticeSession>

import type { PracticeConfig, PracticeExercise } from '@/lib/practice/types'
import { PhonemeFocusShell } from '@/components/phoneme-practice/PhonemeFocusShell'
import { SessionLoadingShell } from './session/SessionLoadingShell'
import { SessionExercisingBody } from './session/SessionExercisingBody'
import { SessionSummary } from './session/SessionSummary'
import { useSessionState, buildSessionResult } from './session/useSessionState'

type Phase = 'exercising' | 'feedback' | 'hints' | 'complete'

function badgeForExercise(
  ex: PracticeExercise | undefined,
  focusBadge: string | undefined,
): string | undefined {
  if (!focusBadge) return undefined
  if (ex?.payload.kind === 'phoneme' && ex.payload.ipa.trim()) return ex.payload.ipa
  return focusBadge
}

export default function PracticeSession(config: PracticeConfig) {
  const { soundIpa, sessionLabel, context, onExit, footer } = config
  const focusBadge = soundIpa ?? sessionLabel
  const focusUi =
    Boolean(focusBadge) &&
    (context === 'sound_lab' || context === 'daily' || context === 'practice')

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
    handleSubmit,
    handleRetry,
    handleHintContinue,
    handlePracticeAgain,
  } = useSessionState(config)

  const current = exercises[currentIndex]
  const displayBadge = badgeForExercise(current, focusBadge) ?? focusBadge ?? ''

  if (!ready) {
    return (
      <SessionLoadingShell
        focusUi={focusUi}
        displayBadge={displayBadge}
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
        onPracticeAgain={handlePracticeAgain}
        onFinish={() => onExit?.(sessionResult)}
      />
    )
    if (focusUi && displayBadge) {
      return (
        <PhonemeFocusShell
          badge={focusBadge ?? displayBadge}
          progressPct={100}
          onExit={() => onExit?.(sessionResult)}
        >
          <div className="phoneme-focus__summary">{summary}</div>
        </PhonemeFocusShell>
      )
    }
    return <div className="w-full max-w-md mx-auto p-6">{summary}</div>
  }

  return (
    <SessionExercisingBody
      lessonFooter={footer}
      state={{
        focusUi,
        displayBadge,
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
