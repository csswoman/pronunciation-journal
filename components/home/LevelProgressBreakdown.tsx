'use client'

// Planned structure:
// <LevelProgressBreakdown>
//   <LevelRow × 5 />   — A1..C1: label + mini bar + learned/total
// </LevelProgressBreakdown>
// Falls back to a single aggregate bar until the dataset resolves (keeps the
// home card cheap on first paint and resilient offline).

import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { CORE1000_PREFIX } from '@/lib/core-1000/types'
import { fetchLevelIndex } from '@/lib/core-1000/level-index-client'
import { tallyLevelProgress, type LevelTallyWord } from '@/lib/core-1000/level-progress'
import { useAuth } from '@/components/auth/AuthProvider'

interface Props {
  /** Aggregate ratio shown while the per-level dataset is still loading. */
  fallbackRatio: number
}

export function LevelProgressBreakdown({ fallbackRatio }: Props) {
  const { user } = useAuth()
  const [words, setWords] = useState<LevelTallyWord[] | null>(null)

  const learnedIds = useLiveQuery(
    () => user?.id ? db.srsData.filter((entry) => entry.userId === user.id && entry.wordId.startsWith(CORE1000_PREFIX)).primaryKeys() : [],
    [user?.id],
  )

  useEffect(() => {
    let cancelled = false
    fetchLevelIndex()
      .then((w) => { if (!cancelled) setWords(w) })
      .catch(() => { /* keep aggregate fallback bar */ })
    return () => { cancelled = true }
  }, [])

  if (!words || !learnedIds) {
    return (
      <div className="mt-auto h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full w-full origin-left rounded-full bg-accent transition-transform duration-500"
          style={{ transform: `scaleX(${fallbackRatio})` }}
        />
      </div>
    )
  }

  const rows = tallyLevelProgress(words, new Set(learnedIds as string[]))

  return (
    <div className="mt-auto flex flex-col gap-1.5">
      {rows.map((row) => (
        <div key={row.level} className="flex items-center gap-2">
          <span className="w-6 font-kicker text-fg-subtle">
            {row.level}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full w-full origin-left rounded-full bg-accent transition-transform duration-500"
              style={{ transform: `scaleX(${row.total > 0 ? row.learned / row.total : 0})` }}
            />
          </div>
          <span className="w-12 text-right text-tiny tabular-nums text-fg-subtle">
            {row.learned}/{row.total}
          </span>
        </div>
      ))}
    </div>
  )
}
