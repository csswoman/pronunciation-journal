'use client'

// Planned structure:
// <Core1000ProgressCard>
//   <ProgressBar />   — learned / total fill
//   label              — "N / 1000 essential words"
// </Core1000ProgressCard>
//
// Core 1000 progress is Dexie-only (no Supabase mirror), so this reads the
// learned count live from IndexedDB.

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

  if (learned === 0) {
    return (
      <Link
        href="/practice/core-1000"
        className="home-card-lift focus-ring flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface-raised p-4 transition-transform active:scale-[0.96]"
      >
        <span className="font-kicker">Core</span>
        <span className="font-label font-semibold text-fg">Essential words</span>
        <span className="font-caption text-fg-muted">Start the Core 1000 deck →</span>
      </Link>
    )
  }

  const ratio = Math.min(1, learned / CORE_1000_TARGET)

  return (
    <Link
      href="/practice/core-1000"
      className="home-card-lift focus-ring flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface-raised p-4 transition-transform active:scale-[0.96]"
    >
      <div className="flex items-baseline justify-between">
        <span className="font-kicker">Core</span>
        <span className="font-caption tabular-nums text-fg-muted">
          <span className="font-semibold text-fg">{learned}</span> / {CORE_1000_TARGET}
        </span>
      </div>
      <span className="font-label font-semibold text-fg">Essential words</span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full w-full origin-left rounded-full bg-accent transition-transform duration-500"
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
    </Link>
  )
}
