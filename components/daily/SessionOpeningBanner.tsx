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
    () => db.srsData.filter((e) => e.wordId.startsWith(CORE1000_PREFIX) && !e.archived).count(),
    [],
    0,
  )

  const parts: string[] = []
  if (arc?.topicLabel) parts.push(arc.topicLabel)
  if (arc?.soundIpa) parts.push(`sonido /${arc.soundIpa}/`)

  const hasFraming = parts.length > 0 || (learned ?? 0) > 0
  if (!hasFraming) return null

  return (
    <div className="mb-5 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-sunken px-4 py-3">
      {parts.length > 0 && (
        <p className="font-body-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">Hoy: </span>
          {parts.join(' · ')}
        </p>
      )}
      {(learned ?? 0) > 0 && (
        <p className="font-caption mt-0.5 tabular-nums text-[var(--text-tertiary)]">
          {learned} / {CORE_1000_TARGET} palabras esenciales
        </p>
      )}
    </div>
  )
}
