'use client'

// Planned structure:
// <ExerciseTestLauncher>
//   <LauncherHeader /> — back to catalog & context badge
//   <LauncherContainer> — max-w-2xl centered session
//     <PracticeSession />
//   </LauncherContainer>
// </ExerciseTestLauncher>

import PracticeSession from '@/components/practice/PracticeSession'
import type { PracticeContext, PracticeExercise } from '@/lib/practice/types'
import { CONTEXT_LABELS } from '@/components/practice/test/constants'
import { ArrowLeft } from "@/components/icons"

export type ExerciseTestSessionState =
  | { phase: 'idle' }
  | { phase: 'session'; exercises: PracticeExercise[]; label: string; context: PracticeContext }

interface Props {
  state: ExerciseTestSessionState
  sessionKey: number
  onExit: () => void
}

export function ExerciseTestLauncher({ state, sessionKey, onExit }: Props) {
  if (state.phase !== 'session') return null

  return (
    <div className="exercise-test-viewport fixed inset-0 z-40 overflow-y-auto bg-surface-base">
      <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-start px-4 py-6 sm:py-10">
        <header className="mb-6 flex items-center justify-between border-b border-border-subtle pb-3">
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-body-sm font-medium text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg focus-ring"
          >
            <ArrowLeft size={16} aria-hidden />
            <span>Volver al catálogo</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-surface-raised px-2.5 py-0.5 font-mono text-tiny text-fg-muted border border-border-subtle">
              {CONTEXT_LABELS[state.context]}
            </span>
            <span className="text-body-sm font-medium text-fg">{state.label}</span>
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center">
          <PracticeSession
            key={sessionKey}
            context={state.context}
            exercises={state.exercises}
            sessionLength={state.exercises.length}
            sessionLabel={state.label}
            onSessionComplete={onExit}
            onExit={onExit}
          />
        </div>
      </div>
    </div>
  )
}
