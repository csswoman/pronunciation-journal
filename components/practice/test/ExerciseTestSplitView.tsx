'use client'

// Planned structure:
// <ExerciseTestSplitView>
//   <SplitHeader />
//   <SplitGrid>
//     <SplitPane side="left" />
//     <SplitPane side="right" />
//   </SplitGrid>
// </ExerciseTestSplitView>

import PracticeSession from '@/components/practice/PracticeSession'
import { CONTEXT_LABELS } from '@/components/practice/test/constants'
import type { TestGalleryEntry } from '@/lib/practice/test-gallery/fixtures'
import type { PracticeContext } from '@/lib/practice/types'
import { ArrowLeft } from "@/components/icons"

export type ExerciseTestSplitState = {
  entry: TestGalleryEntry
  leftContext: PracticeContext
  rightContext: PracticeContext
}

interface Props {
  state: ExerciseTestSplitState
  sessionKey: number
  onExit: () => void
}

function SplitPane({
  context,
  entry,
  sessionKey,
  side,
}: {
  context: PracticeContext
  entry: TestGalleryEntry
  sessionKey: number
  side: 'left' | 'right'
}) {
  return (
    <div className="exercise-test-split-pane flex min-h-0 flex-1 flex-col border-border-subtle first:border-b lg:first:border-b-0 lg:first:border-r">
      <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface-raised px-4 py-2.5">
        <span className="font-mono text-tiny font-semibold uppercase tracking-wide text-primary">
          Panel {side === 'left' ? 'A' : 'B'} · {CONTEXT_LABELS[context]}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col justify-start">
        <div className="mx-auto w-full max-w-lg">
          <PracticeSession
            key={`${sessionKey}-${side}-${context}`}
            context={context}
            exercises={[entry.build(context)]}
            sessionLength={1}
            sessionLabel={entry.label}
            onSessionComplete={() => {}}
            onExit={() => {}}
          />
        </div>
      </div>
    </div>
  )
}

export function ExerciseTestSplitView({ state, sessionKey, onExit }: Props) {
  const { entry, leftContext, rightContext } = state

  return (
    <div className="exercise-test-viewport fixed inset-0 z-40 flex flex-col bg-surface-base">
      <header className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface-raised px-4 py-2.5">
        <button
          type="button"
          onClick={onExit}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-body-sm font-medium text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring"
        >
          <ArrowLeft size={16} aria-hidden />
          <span>Volver al catálogo</span>
        </button>
        <span className="text-body-sm font-semibold text-fg">
          Comparativa Split: {entry.label}
        </span>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <SplitPane context={leftContext} entry={entry} sessionKey={sessionKey} side="left" />
        <SplitPane context={rightContext} entry={entry} sessionKey={sessionKey} side="right" />
      </div>
    </div>
  )
}
