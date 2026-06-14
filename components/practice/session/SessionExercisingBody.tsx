'use client'

// Planned structure:
// <SessionExercisingBody>
//   <PhonemeFocusShell>    (when focusUi mode)
//     <SessionProgress />
//     <ExerciseRenderer />
//     <InlineFeedback />   (via PhonemeFocusShell feedback prop)
//     <ExerciseHints />    (via PhonemeFocusShell footer prop, hints phase)
//   </PhonemeFocusShell>
//   plain layout           (otherwise, same children without shell)
// </SessionExercisingBody>

import { useState } from 'react'
import { PhonemeFocusShell } from '@/components/phoneme-practice/PhonemeFocusShell'
import { ExerciseHints } from '@/components/phoneme-practice/ExerciseHints'
import { ExerciseRenderer } from './ExerciseRenderer'
import { SessionProgress } from './SessionProgress'
import { InlineFeedback } from './InlineFeedback'
import { ExitConfirmSheet } from '@/components/exercises/ExitConfirmSheet'
import type React from 'react'
import type { PracticeExercise, SessionResult } from '@/lib/practice/types'

type Phase = 'exercising' | 'feedback' | 'hints' | 'complete'

export interface SessionExercisingBodyState {
  focusUi: boolean
  displayBadge: string
  progressPct: number
  phase: Phase
  current: PracticeExercise | undefined
  currentIndex: number
  totalExercises: number
  retryKey: number
  lastFeedback: boolean | null
  currentVoice: SpeechSynthesisVoice | undefined
  results: SessionResult['results']
}

export interface SessionExercisingBodyHandlers {
  onSubmit: (isCorrect: boolean, userAnswer: string) => void
  onRetry: () => void
  onHintContinue: () => void
  onExit: (result: SessionResult) => void
}

interface SessionExercisingBodyProps {
  state: SessionExercisingBodyState
  handlers: SessionExercisingBodyHandlers
  lessonFooter?: React.ReactNode
}

function buildPartialResult(results: SessionResult['results']): SessionResult {
  const total = results.length
  const correct = results.filter((r) => r.isCorrect).length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const totalTimeMs = results.reduce((acc, r) => acc + r.timeMs, 0)
  const bySlug = {} as SessionResult['bySlug']
  for (const r of results) {
    const entry = bySlug[r.slug] ?? { total: 0, correct: 0 }
    entry.total += 1
    if (r.isCorrect) entry.correct += 1
    bySlug[r.slug] = entry
  }
  return { results, accuracy, totalTimeMs, bySlug }
}

export function SessionExercisingBody({ state, handlers, lessonFooter }: SessionExercisingBodyProps) {
  const {
    focusUi, displayBadge, progressPct, phase, current,
    currentIndex, totalExercises, retryKey, lastFeedback, currentVoice, results,
  } = state
  const { onSubmit, onRetry, onHintContinue, onExit } = handlers

  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const sessionBody = (
    <>
      {!focusUi && <SessionProgress current={currentIndex} total={totalExercises} />}

      {current && (phase === 'exercising' || phase === 'feedback' || phase === 'hints') && (
        <ExerciseRenderer
          key={`${current.id}-${retryKey}`}
          exercise={current}
          onSubmit={onSubmit}
          focusUi={focusUi}
          voice={currentVoice}
        />
      )}

      {phase === 'feedback' && lastFeedback !== null && !focusUi && (
        <InlineFeedback isCorrect={lastFeedback} />
      )}

      {phase === 'hints' && current?.payload.kind === 'phoneme' && !focusUi && (
        <ExerciseHints
          ipa={current.payload.ipa}
          targetWord={current.payload.targetWord}
          onRetry={onRetry}
          onContinue={onHintContinue}
          voice={currentVoice}
        />
      )}
    </>
  )

  if (focusUi && displayBadge) {
    return (
      <>
        <PhonemeFocusShell
          badge={displayBadge}
          progressPct={progressPct}
          onExit={() => setShowExitConfirm(true)}
          feedback={
            phase === 'feedback' && lastFeedback !== null
              ? {
                  isCorrect: lastFeedback,
                  subtitle: lastFeedback ? 'Siguiente ejercicio…' : undefined,
                }
              : null
          }
          footer={
            <>
              {phase === 'hints' && current?.payload.kind === 'phoneme' && (
                <div className="phoneme-focus__hints-panel">
                  <ExerciseHints
                    ipa={current.payload.ipa}
                    targetWord={current.payload.targetWord}
                    onRetry={onRetry}
                    onContinue={onHintContinue}
                    voice={currentVoice}
                  />
                </div>
              )}
              {lessonFooter}
            </>
          }
        >
          {sessionBody}
        </PhonemeFocusShell>
        <ExitConfirmSheet
          open={showExitConfirm}
          onConfirm={() => { setShowExitConfirm(false); onExit(buildPartialResult(results)) }}
          onCancel={() => setShowExitConfirm(false)}
        />
      </>
    )
  }

  return (
    <>
      <div className="w-full max-w-md mx-auto flex flex-col gap-6">{sessionBody}</div>
      <ExitConfirmSheet
        open={showExitConfirm}
        onConfirm={() => { setShowExitConfirm(false); onExit(buildPartialResult(results)) }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </>
  )
}
