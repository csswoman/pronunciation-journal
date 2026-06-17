'use client'

import PracticeSession from '@/components/practice/PracticeSession'
import { CONTEXT_LABELS } from '@/components/practice/test/constants'
import type { TestGalleryEntry } from '@/lib/practice/test-gallery/fixtures'
import type { PracticeContext } from '@/lib/practice/types'

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
    <div className="exercise-test-split-pane flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle bg-surface-raised px-4 py-2">
        <span className="font-caption font-semibold uppercase tracking-wide text-fg-muted">
          {CONTEXT_LABELS[context]}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
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
  )
}

export function ExerciseTestSplitView({ state, sessionKey }: Props) {
  const { entry, leftContext, rightContext } = state

  return (
    <div className="exercise-test-viewport fixed inset-0 z-40 flex flex-col bg-surface-base">
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <SplitPane context={leftContext} entry={entry} sessionKey={sessionKey} side="left" />
        <SplitPane context={rightContext} entry={entry} sessionKey={sessionKey} side="right" />
      </div>
    </div>
  )
}
