'use client'

// Planned structure:
// <ExerciseTestSidebar>
//   <ExerciseTestControls />
//   <ExerciseTestNav />
// </ExerciseTestSidebar>

import { X } from 'lucide-react'
import { ExerciseTestControls } from '@/components/practice/test/ExerciseTestControls'
import { ExerciseTestNav } from '@/components/practice/test/ExerciseTestNav'
import { TEST_SIDEBAR_CLASS } from '@/components/practice/test/constants'
import type { TestGalleryDomain, TestGalleryEntry } from '@/lib/practice/test-gallery/fixtures'
import type { PracticeContext } from '@/lib/practice/types'

type ViewMode = 'single' | 'split'

interface Props {
  context: PracticeContext
  compareContext: PracticeContext
  canSplit: boolean
  usesFocusShell: boolean
  grouped: { domain: TestGalleryDomain; items: TestGalleryEntry[] }[]
  activeEntryId: string | null
  viewMode: ViewMode
  overlayOpen: boolean
  canStep: boolean
  onContextChange: (value: PracticeContext) => void
  onCompareContextChange: (value: PracticeContext) => void
  onLaunchAll: () => void
  onSplitQuick: () => void
  onViewModeChange: (mode: ViewMode) => void
  onPrev: () => void
  onNext: () => void
  onSelect: (entry: TestGalleryEntry, mode: ViewMode) => void
  onExitOverlay: () => void
}

export function ExerciseTestSidebar(props: Props) {
  const {
    context,
    compareContext,
    canSplit,
    usesFocusShell,
    grouped,
    activeEntryId,
    viewMode,
    overlayOpen,
    canStep,
    onContextChange,
    onCompareContextChange,
    onLaunchAll,
    onSplitQuick,
    onViewModeChange,
    onPrev,
    onNext,
    onSelect,
    onExitOverlay,
  } = props

  return (
    <aside
      className={`flex w-full shrink-0 flex-col border-border-subtle bg-surface-base lg:sticky lg:top-0 lg:h-dvh lg:w-72 lg:border-l ${TEST_SIDEBAR_CLASS}`}
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <div>
          <p className="font-caption font-semibold uppercase tracking-wide text-fg-subtle">Test UI</p>
          <p className="text-sm font-medium text-fg">Navegación</p>
        </div>
        {overlayOpen ? (
          <button
            type="button"
            onClick={onExitOverlay}
            className="flex items-center gap-1 rounded-[var(--radius-md)] px-2 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
          >
            <X size={14} aria-hidden />
            Cerrar
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto p-4">
        <ExerciseTestControls
          context={context}
          compareContext={compareContext}
          canSplit={canSplit}
          usesFocusShell={usesFocusShell}
          onContextChange={onContextChange}
          onCompareContextChange={onCompareContextChange}
          onLaunchAll={onLaunchAll}
          onSplitQuick={onSplitQuick}
        />
        <ExerciseTestNav
          grouped={grouped}
          activeEntryId={activeEntryId}
          viewMode={viewMode}
          canSplit={canSplit}
          canStep={canStep}
          onViewModeChange={onViewModeChange}
          onPrev={onPrev}
          onNext={onNext}
          onSelect={onSelect}
        />
      </div>
    </aside>
  )
}
