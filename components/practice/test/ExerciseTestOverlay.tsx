'use client'

import { ExerciseTestLauncher, type ExerciseTestSessionState } from '@/components/practice/test/ExerciseTestLauncher'
import {
  ExerciseTestSplitView,
  type ExerciseTestSplitState,
} from '@/components/practice/test/ExerciseTestSplitView'

export type ExerciseTestOverlayState =
  | { mode: 'idle' }
  | ({ mode: 'single'; entryId: string } & Extract<ExerciseTestSessionState, { phase: 'session' }>)
  | ({ mode: 'split'; entryId: string } & ExerciseTestSplitState)
  | {
      mode: 'all'
      phase: 'session'
      exercises: Extract<ExerciseTestSessionState, { phase: 'session' }>['exercises']
      label: string
      context: Extract<ExerciseTestSessionState, { phase: 'session' }>['context']
    }

export function overlayEntryId(state: ExerciseTestOverlayState): string | null {
  if (state.mode === 'single' || state.mode === 'split') return state.entryId
  return null
}

interface Props {
  state: ExerciseTestOverlayState
  sessionKey: number
  onExit: () => void
}

export function ExerciseTestOverlay({ state, sessionKey, onExit }: Props) {
  if (state.mode === 'idle') return null

  if (state.mode === 'split') {
    return (
      <ExerciseTestSplitView
        state={{
          entry: state.entry,
          leftContext: state.leftContext,
          rightContext: state.rightContext,
        }}
        sessionKey={sessionKey}
        onExit={onExit}
      />
    )
  }

  return (
    <ExerciseTestLauncher
      state={{
        phase: 'session',
        exercises: state.exercises,
        label: state.label,
        context: state.context,
      }}
      sessionKey={sessionKey}
      onExit={onExit}
    />
  )
}
