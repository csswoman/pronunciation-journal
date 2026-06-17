'use client'

// Planned structure:
// <ExerciseTestHub>
//   <main /> — exercise viewport
//   <ExerciseTestSidebar />
// </ExerciseTestHub>

import { useCallback, useMemo, useState } from 'react'
import {
  ExerciseTestOverlay,
  overlayEntryId,
  type ExerciseTestOverlayState,
} from '@/components/practice/test/ExerciseTestOverlay'
import { ExerciseTestSidebar } from '@/components/practice/test/ExerciseTestSidebar'
import { DOMAIN_ORDER } from '@/components/practice/test/constants'
import {
  FOCUS_UI_CONTEXTS,
  TEST_GALLERY_ENTRIES,
  type TestGalleryDomain,
  type TestGalleryEntry,
} from '@/lib/practice/test-gallery/fixtures'
import type { PracticeContext } from '@/lib/practice/types'

type ViewMode = 'single' | 'split'

function groupByDomain(entries: TestGalleryEntry[]) {
  const map = new Map<TestGalleryDomain, TestGalleryEntry[]>()
  for (const domain of DOMAIN_ORDER) map.set(domain, [])
  for (const entry of entries) {
    map.get(entry.domain)?.push(entry)
  }
  return DOMAIN_ORDER.map((domain) => ({ domain, items: map.get(domain) ?? [] }))
}

function entryIndex(entryId: string | null): number {
  if (!entryId) return -1
  return TEST_GALLERY_ENTRIES.findIndex((entry) => entry.id === entryId)
}

export function ExerciseTestHub() {
  const [context, setContext] = useState<PracticeContext>('daily')
  const [compareContext, setCompareContext] = useState<PracticeContext>('review')
  const [viewMode, setViewMode] = useState<ViewMode>('single')
  const [sessionKey, setSessionKey] = useState(0)
  const [overlay, setOverlay] = useState<ExerciseTestOverlayState>({ mode: 'idle' })

  const grouped = useMemo(() => groupByDomain(TEST_GALLERY_ENTRIES), [])
  const usesFocusShell = FOCUS_UI_CONTEXTS.includes(context)
  const canSplit = compareContext !== context
  const activeEntryId = overlayEntryId(overlay)
  const overlayOpen = overlay.mode !== 'idle'
  const canStep = activeEntryId != null

  const bumpSessionKey = useCallback(() => {
    setSessionKey((k) => k + 1)
  }, [])

  const launch = useCallback(
    (entry: TestGalleryEntry) => {
      bumpSessionKey()
      setOverlay({
        mode: 'single',
        entryId: entry.id,
        phase: 'session',
        exercises: [entry.build(context)],
        label: entry.label,
        context,
      })
    },
    [bumpSessionKey, context],
  )

  const launchSplit = useCallback(
    (entry: TestGalleryEntry) => {
      if (!canSplit) return
      bumpSessionKey()
      setOverlay({
        mode: 'split',
        entryId: entry.id,
        entry,
        leftContext: context,
        rightContext: compareContext,
      })
    },
    [bumpSessionKey, canSplit, compareContext, context],
  )

  const openEntry = useCallback(
    (entry: TestGalleryEntry, mode: ViewMode) => {
      if (mode === 'split' && canSplit) launchSplit(entry)
      else launch(entry)
    },
    [canSplit, launch, launchSplit],
  )

  const stepEntry = useCallback(
    (delta: number) => {
      const idx = entryIndex(activeEntryId)
      if (idx < 0) return
      const next =
        TEST_GALLERY_ENTRIES[(idx + delta + TEST_GALLERY_ENTRIES.length) % TEST_GALLERY_ENTRIES.length]!
      if (overlay.mode === 'split') launchSplit(next)
      else launch(next)
    },
    [activeEntryId, launch, launchSplit, overlay.mode],
  )

  const launchAll = useCallback(() => {
    bumpSessionKey()
    setOverlay({
      mode: 'all',
      phase: 'session',
      exercises: TEST_GALLERY_ENTRIES.map((entry) => entry.build(context)),
      label: 'Galería completa',
      context,
    })
  }, [bumpSessionKey, context])

  const launchSplitQuick = useCallback(() => {
    const entry = TEST_GALLERY_ENTRIES[0]!
    bumpSessionKey()
    setOverlay({
      mode: 'split',
      entryId: entry.id,
      entry,
      leftContext: 'daily',
      rightContext: 'review',
    })
  }, [bumpSessionKey])

  const exitOverlay = useCallback(() => {
    setOverlay({ mode: 'idle' })
  }, [])

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="relative min-h-[50dvh] min-w-0 flex-1 lg:min-h-dvh">
        <ExerciseTestOverlay state={overlay} sessionKey={sessionKey} onExit={exitOverlay} />

        {!overlayOpen ? (
          <div className="flex h-full flex-col justify-center px-6 py-12 lg:px-10">
            <header className="flex max-w-lg flex-col gap-2">
              <span className="font-caption font-semibold uppercase tracking-[0.18em] text-fg-subtle">
                Dev only
              </span>
              <h1 className="font-display text-h2 font-normal tracking-[-0.02em] text-fg">
                Exercise UI gallery
              </h1>
              <p className="text-body-sm text-fg-muted">
                Elige un ejercicio en el panel de la derecha. Usa{' '}
                <span className="font-medium text-fg-secondary">Rotar</span> para cambiar sin cerrar la
                sesión.
              </p>
            </header>
          </div>
        ) : null}
      </div>

      <ExerciseTestSidebar
        context={context}
        compareContext={compareContext}
        canSplit={canSplit}
        usesFocusShell={usesFocusShell}
        grouped={grouped}
        activeEntryId={activeEntryId}
        viewMode={viewMode}
        overlayOpen={overlayOpen}
        canStep={canStep}
        onContextChange={setContext}
        onCompareContextChange={setCompareContext}
        onLaunchAll={launchAll}
        onSplitQuick={launchSplitQuick}
        onViewModeChange={setViewMode}
        onPrev={() => stepEntry(-1)}
        onNext={() => stepEntry(1)}
        onSelect={openEntry}
        onExitOverlay={exitOverlay}
      />
    </div>
  )
}
