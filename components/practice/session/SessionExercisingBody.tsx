'use client'

// Planned structure:
// <SessionExercisingBody>
//   <PhonemeFocusShell>    (handles top chrome + card surface for focus sessions)
//     <ExerciseRenderer />
//     <ExerciseHints />
//   </PhonemeFocusShell>
//   <PlainSessionShell>    (same top chrome + card surface for generic sessions)
//     <ExerciseRenderer />
//   </PlainSessionShell>
// </SessionExercisingBody>

import { useState } from 'react'
import { X } from '@/components/icons'
import { PhonemeFocusShell } from '@/components/phoneme-practice/PhonemeFocusShell'
import { ExerciseHints } from '@/components/phoneme-practice/ExerciseHints'
import { ExerciseRenderer } from './ExerciseRenderer'
import { InlineFeedback } from './InlineFeedback'
import { ExitConfirmSheet } from '@/components/exercises/ExitConfirmSheet'
import type React from 'react'
import type { PracticeExercise, PracticeSubmitHandler, SessionResult } from '@/lib/practice/types'

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
  onSubmit: PracticeSubmitHandler
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

  const isGenericExercise = current?.payload.kind === 'generic'

  const sessionBody = (
    <>
      {current && (phase === 'exercising' || phase === 'feedback' || phase === 'hints') && (
        <ExerciseRenderer
          key={`${current.id}-${retryKey}`}
          exercise={current}
          onSubmit={onSubmit}
          focusUi={focusUi}
          voice={currentVoice}
          showSkip={phase === 'exercising'}
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

  const stepCurrent = currentIndex + 1
  const stepTotal = Math.max(totalExercises, 1)

  if (focusUi && displayBadge) {
    return (
      <PhonemeFocusShell
        progressPct={progressPct}
        stepCurrent={stepCurrent}
        stepTotal={stepTotal}
        onExit={() => setShowExitConfirm(true)}
        feedback={
          phase === 'feedback' && lastFeedback !== null && !isGenericExercise
            ? {
                isCorrect: lastFeedback,
                subtitle: lastFeedback ? 'Siguiente ejercicio…' : undefined,
              }
            : null
        }
        footer={
          <>
            {phase === 'hints' && current?.payload.kind === 'phoneme' && (
              <div className="w-full">
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
            <ExitConfirmSheet
              open={showExitConfirm}
              onConfirm={() => { setShowExitConfirm(false); onExit(buildPartialResult(results)) }}
              onCancel={() => setShowExitConfirm(false)}
              backdrop={false}
            />
          </>
        }
      >
        {sessionBody}
      </PhonemeFocusShell>
    )
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-layout-session-max flex-col gap-layout-stack px-4 py-4 sm:py-6">
      {/* Top Chrome matching Essential Words */}
      <header className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          aria-label="Salir de la práctica"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-fg-subtle transition-colors duration-150 ease-out-quart focus-ring hover:bg-surface-raised hover:text-fg-muted cursor-pointer"
        >
          <X size={16} aria-hidden />
        </button>

        <div
          role="progressbar"
          aria-valuenow={stepCurrent}
          aria-valuemin={0}
          aria-valuemax={stepTotal}
          aria-label={`Paso ${stepCurrent} de ${stepTotal}`}
          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-sunken"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out-quart"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <span className="shrink-0 font-caption tabular-nums text-fg-muted">
          {stepCurrent} / {stepTotal}
        </span>
      </header>

      {/* Main Center Stage with Card Container */}
      <main className="flex flex-1 flex-col items-center justify-center w-full">
        <div className="flex w-full flex-col rounded-2xl border border-border-subtle bg-surface-raised p-6 sm:p-8 shadow-xs gap-6">
          {sessionBody}
        </div>
      </main>

      {lessonFooter}
      <ExitConfirmSheet
        open={showExitConfirm}
        onConfirm={() => { setShowExitConfirm(false); onExit(buildPartialResult(results)) }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  )
}
