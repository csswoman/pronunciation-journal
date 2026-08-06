'use client'

// Planned structure:
// <SessionReady>
//   <SessionReadyHero />
//   <SessionReadyLevelProgress />
//   <SessionReadyInsights />
//   <SessionReadyVaultRow />
// </SessionReady>

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
  onBegin: () => void
}

export function SessionReady({
  counts,
  stats,
  streak,
  activeRouteId,
  onRouteChange,
  onBegin,
}: Props) {
  const isResume = counts.learningRemaining > 0

  return (
    <section
      aria-labelledby="session-ready-title"
      className="flex w-full flex-col gap-layout-stack animate-message-in"
    >
      <SessionReadyHero
        counts={counts}
        stats={stats}
        isResume={isResume}
        activeRouteId={activeRouteId}
        onRouteChange={onRouteChange}
        onBegin={onBegin}
      />
      <SessionReadyLevelProgress />
      <SessionReadyInsights stats={stats} streak={streak} />
      <SessionReadyVaultRow />
    </section>
  )
}
