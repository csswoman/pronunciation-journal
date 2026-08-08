'use client'

// Planned structure:
// <SessionReadyLevelProgress>
//   title row + <LevelProgressBar /> + milestone copy
// </SessionReadyLevelProgress>

import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { ESSENTIAL_WORD_PREFIX } from '@/lib/essential-words/types'
import { fetchLevelIndex } from '@/lib/essential-words/level-index-client'
import {
  levelMilestoneMessage,
  levelProgressBarSegments,
  tallyLevelProgress,
  type LevelTallyWord,
} from '@/lib/essential-words/level-progress'
import { useAuth } from '@/components/auth/AuthProvider'
import { LevelProgressBar } from './LevelProgressBar'
import { SessionSurface } from './session-chrome'

export function SessionReadyLevelProgress() {
  const { user } = useAuth()
  const [words, setWords] = useState<LevelTallyWord[] | null>(null)

  const learnedIds = useLiveQuery(
    () =>
      user?.id
        ? db.srsData
            .filter(
              (entry) =>
                entry.userId === user.id && entry.wordId.startsWith(ESSENTIAL_WORD_PREFIX),
            )
            .primaryKeys()
        : [],
    [user?.id],
  )

  useEffect(() => {
    let cancelled = false
    fetchLevelIndex()
      .then((nextWords) => {
        if (!cancelled) setWords(nextWords)
      })
      .catch(() => {
        /* wait for data */
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!words || !learnedIds) {
    return (
      <SessionSurface className="gap-3" aria-hidden>
        <div className="h-4 w-28 animate-pulse rounded bg-surface-sunken" />
        <div className="h-2 w-full animate-pulse rounded-full bg-surface-sunken" />
        <div className="h-3 w-full animate-pulse rounded bg-surface-sunken" />
      </SessionSurface>
    )
  }

  const rows = tallyLevelProgress(words, new Set(learnedIds as string[]))
  const segments = levelProgressBarSegments(rows)
  const milestone = levelMilestoneMessage(rows)

  return (
    <SessionSurface className="gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="m-0 font-label text-fg">Tu progreso</h3>
      </div>
      <LevelProgressBar segments={segments} />
      {milestone ? (
        <p className="m-0 text-caption text-pretty text-fg-muted">{milestone}</p>
      ) : null}
    </SessionSurface>
  )
}
