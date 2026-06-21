'use client'

// Planned structure:
// <SessionOpeningBanner>
//   tema del día (topicLabel + soundIpa)
//   Core 1000 count (N / 1000)
// </SessionOpeningBanner>
//
// Opening framing for the daily session. Core 1000 progress is Dexie-only, read
// live from IndexedDB (offline-safe). Renders nothing when there is no framing data.

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { CORE1000_PREFIX } from '@/lib/core-1000/types'
import type { SessionArc } from '@/lib/practice/types'

const CORE_1000_TARGET = 1000

interface Props {
  arc: SessionArc | undefined
}

export default function SessionOpeningBanner({ arc }: Props) {
  const learned = useLiveQuery(
    () => db.srsData.filter((e) => e.wordId.startsWith(CORE1000_PREFIX)).count(),
    [],
    0,
  )

  const hasFraming = !!(arc?.topicLabel || arc?.soundIpa) || (learned ?? 0) > 0
  if (!hasFraming) return null

  const learnedCount = learned ?? 0
  const progressPct = Math.min(100, (learnedCount / CORE_1000_TARGET) * 100)

  return (
    <div className="mb-5 rounded-xl border border-(--accent-border) bg-primary-50 px-4 py-3.5">
      {(arc?.topicLabel || arc?.soundIpa) && (
        <p className="font-body-sm text-fg-muted">
          <span className="font-semibold text-fg">Hoy </span>
          {arc.topicLabel && <span>{arc.topicLabel}</span>}
          {arc.topicLabel && arc.soundIpa && (
            <span className="text-fg-subtle"> · </span>
          )}
          {arc.soundIpa && (
            <>
              <span className="text-fg-subtle">sonido </span>
              <code className="font-mono text-tiny font-semibold text-primary">/{arc.soundIpa}/</code>
            </>
          )}
        </p>
      )}
      {learnedCount > 0 && (
        <div className="mt-2">
          <div className="mb-1.5 flex items-baseline justify-between">
            <p className="font-caption text-fg-subtle">Core 1000</p>
            <p className="font-caption text-fg-subtle">
              <span className="tabular-nums font-medium text-fg-muted">{learnedCount}</span>
              <span> / {CORE_1000_TARGET}</span>
            </p>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-100">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
