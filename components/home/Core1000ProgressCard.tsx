'use client'

// Planned structure:
// <Core1000ProgressCard>
//   <ProgressBar />   — learned / total fill
//   label              — "N de 1000 palabras esenciales"
// </Core1000ProgressCard>
//
// Core 1000 progress is Dexie-only (no Supabase mirror), so this reads the
// learned count live from IndexedDB. Renders nothing until a baseline total is
// known, and stays silent for users who have not started the deck.

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { CORE1000_PREFIX } from '@/lib/core-1000/types'

/** The Core 1000 milestone the learner is progressing toward. */
const CORE_1000_TARGET = 1000

export default function Core1000ProgressCard() {
  const learned = useLiveQuery(
    () =>
      db.srsData
        .filter((e) => e.wordId.startsWith(CORE1000_PREFIX))
        .count(),
    [],
    0,
  )

  if (learned === 0) return null

  const ratio = Math.min(1, learned / CORE_1000_TARGET)

  return (
    <Link
      href="/practice/core-1000"
      className="flex flex-col gap-2 rounded-md border border-border-default bg-surface-raised p-4 transition-colors hover:border-border-strong"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-caption font-semibold uppercase tracking-widest text-fg-subtle">
          Palabras esenciales
        </span>
        <span className="text-caption tabular-nums text-fg-muted">
          <span className="font-semibold text-fg">{learned}</span> de {CORE_1000_TARGET}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full w-full origin-left rounded-full bg-accent transition-transform duration-500"
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
    </Link>
  )
}
