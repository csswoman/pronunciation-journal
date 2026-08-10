'use client'

// Planned structure:
// <SessionReady>
//   <SessionReadyHero />
//   <SessionReadyLevelProgress />
//   <SessionReadyInsights />
//   <SessionReadyVaultRow />
// </SessionReady>

import type { SessionSizeId } from '@/lib/essential-words/session-size'
import type { EssentialWordsCounts, EssentialWordsStats } from '@/hooks/useEssentialWordsSession'
import { SessionReadyHero } from './SessionReadyHero'
import { SessionReadyInsights } from './SessionReadyInsights'
import { SessionReadyLevelProgress } from './SessionReadyLevelProgress'
import { SessionReadyVaultRow } from './SessionReadyVaultRow'

interface Props {
  counts: EssentialWordsCounts
  stats: EssentialWordsStats
  streak: number
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
  sessionSize: SessionSizeId
  onSessionSizeChange: (id: SessionSizeId) => void
  onBegin: () => void
}

export function SessionReady({
  counts,
  stats,
  streak,
  activeRouteId,
  onRouteChange,
  sessionSize,
  onSessionSizeChange,
  onBegin,
}: Props) {
  const isResume = counts.learningRemaining > 0

  return (
    <section
      aria-labelledby="session-ready-title"
      className="flex w-full flex-col gap-space-6 animate-message-in sm:gap-space-8"
    >
      <SessionReadyHero
        counts={counts}
        stats={stats}
        isResume={isResume}
        activeRouteId={activeRouteId}
        onRouteChange={onRouteChange}
        sessionSize={sessionSize}
        onSessionSizeChange={onSessionSizeChange}
        onBegin={onBegin}
      />
      <SessionReadyLevelProgress />
      <SessionReadyInsights stats={stats} streak={streak} />
      <SessionReadyVaultRow />
    </section>
  )
}
