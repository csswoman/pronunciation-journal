'use client'

// Planned structure:
// <LevelProgressBreakdown>
//   level rows including current (A1 · 2 de 740) + collapsed rest
// </LevelProgressBreakdown>

import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { ESSENTIAL_WORD_PREFIX } from '@/lib/essential-words/types'
import { fetchLevelIndex } from '@/lib/essential-words/level-index-client'
import {
  displayLevelProgress,
  tallyLevelProgress,
  type LevelTallyWord,
} from '@/lib/essential-words/level-progress'
import { useAuth } from '@/components/auth/AuthProvider'

interface Props {
  fallbackRatio?: number
}

export function LevelProgressBreakdown({ fallbackRatio }: Props) {
  void fallbackRatio
  const { user } = useAuth()
  const [words, setWords] = useState<LevelTallyWord[] | null>(null)

  const learnedIds = useLiveQuery(
    () => user?.id ? db.srsData.filter((entry) => entry.userId === user.id && entry.wordId.startsWith(ESSENTIAL_WORD_PREFIX)).primaryKeys() : [],
    [user?.id],
  )

  useEffect(() => {
    let cancelled = false
    fetchLevelIndex()
      .then((w) => { if (!cancelled) setWords(w) })
      .catch(() => { /* wait for data */ })
    return () => { cancelled = true }
  }, [])

  if (!words || !learnedIds) {
    return (
      <p className="mt-auto font-body-sm text-fg-muted">Cargando progreso…</p>
    )
  }

  const rows = tallyLevelProgress(words, new Set(learnedIds as string[]))
  const displayRows = displayLevelProgress(rows)

  return (
    <div className="mt-auto flex flex-col gap-1">
      {displayRows.map((row) =>
        row.kind === 'collapsed' ? (
          <p
            key={`${row.from}-${row.to}`}
            className="font-caption text-fg-muted"
          >
            {row.from}–{row.to} · sin empezar
          </p>
        ) : (
          <p key={row.level} className="font-caption tabular-nums text-fg-muted">
            {row.level} · {row.learned} de {row.total}
          </p>
        ),
      )}
    </div>
  )
}
