'use client'

// Planned structure:
// <ExerciseTestHub>
//   <main>
//     <ExerciseTestOverlay />
//     <EssentialWordsPreview />
//     <ExerciseTestCatalog />
//   </main>
//   <ExerciseTestSidebar />
// </ExerciseTestHub>

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ExerciseTestOverlay,
  overlayEntryId,
  type ExerciseTestOverlayState,
} from '@/components/practice/test/ExerciseTestOverlay'
import { ExerciseTestSidebar } from '@/components/practice/test/ExerciseTestSidebar'
import { ExerciseTestCatalog } from '@/components/practice/test/ExerciseTestCatalog'
import { EssentialWordsSession } from '@/components/practice/essential-words/EssentialWordsSession'
import { WordStudyCard } from '@/components/practice/essential-words/WordStudyCard'
import { DOMAIN_ORDER } from '@/components/practice/test/constants'
import {
  FOCUS_UI_CONTEXTS,
  TEST_GALLERY_ENTRIES,
  type TestGalleryDomain,
  type TestGalleryEntry,
} from '@/lib/practice/test-gallery/fixtures'
import type { PracticeContext } from '@/lib/practice/types'
import type { EssentialWord } from '@/lib/essential-words/types'

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
  const [essentialWordsOpen, setEssentialWordsOpen] = useState(false)
  const [pilotEntries, setPilotEntries] = useState<EssentialWord[]>([])
  const [pilotWord, setPilotWord] = useState('')

  useEffect(() => {
    void fetch('/essential-words/words-all.json')
      .then((response) => response.ok ? response.json() : null)
      .then((data: { entries?: EssentialWord[] } | null) => {
        setPilotEntries((data?.entries ?? []).filter((entry) => entry.study))
      })
      .catch(() => setPilotEntries([]))
  }, [])

  const grouped = useMemo(() => groupByDomain(TEST_GALLERY_ENTRIES), [])
  const usesFocusShell = FOCUS_UI_CONTEXTS.includes(context)
  const canSplit = compareContext !== context
  const activeEntryId = overlayEntryId(overlay)
  const overlayOpen = overlay.mode !== 'idle'
  const canStep = activeEntryId != null
  const selectedPilotEntry = pilotEntries.find((entry) => entry.word === pilotWord)

  const bumpSessionKey = useCallback(() => {
    setSessionKey((k) => k + 1)
  }, [])

  const launch = useCallback(
    (entry: TestGalleryEntry) => {
      bumpSessionKey()
      setEssentialWordsOpen(false)
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
      setEssentialWordsOpen(false)
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
    setEssentialWordsOpen(false)
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
    setEssentialWordsOpen(false)
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
    setEssentialWordsOpen(false)
  }, [])

  const openEssentialWords = useCallback(() => {
    setOverlay({ mode: 'idle' })
    setEssentialWordsOpen(true)
  }, [])

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="relative min-h-[50dvh] min-w-0 flex-1 lg:min-h-dvh">
        <ExerciseTestOverlay state={overlay} sessionKey={sessionKey} onExit={exitOverlay} />

        {essentialWordsOpen ? (
          <div className="min-h-dvh px-4 py-6 sm:px-8 sm:py-10">
            {pilotEntries.length > 0 ? (
              <label className="mb-layout-stack flex max-w-sm flex-col gap-1 text-label text-fg">
                Revisar palabra del piloto
                <select
                  value={pilotWord}
                  onChange={(event) => setPilotWord(event.target.value)}
                  className="rounded-md border border-border-subtle bg-surface-raised px-3 py-2 text-body-sm text-fg focus-ring"
                >
                  <option value="">Sesión real</option>
                  {pilotEntries.map((entry) => <option key={entry.word} value={entry.word}>{entry.word}</option>)}
                </select>
              </label>
            ) : null}
            {selectedPilotEntry ? (
              <WordStudyCard entry={selectedPilotEntry} onContinue={() => undefined} onOmit={() => undefined} />
            ) : <EssentialWordsSession key="test-essential-words" />}
          </div>
        ) : !overlayOpen ? (
          <div className="min-h-dvh overflow-y-auto">
            <ExerciseTestCatalog
              grouped={grouped}
              activeEntryId={activeEntryId}
              canSplit={canSplit}
              onSelect={openEntry}
              onLaunchAll={launchAll}
              onOpenEssentialWords={openEssentialWords}
            />
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
        essentialWordsOpen={essentialWordsOpen}
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
        onOpenEssentialWords={openEssentialWords}
      />
    </div>
  )
}
