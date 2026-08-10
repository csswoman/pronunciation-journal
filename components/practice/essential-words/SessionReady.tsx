'use client'

// Planned structure:
// <SessionReady>
//   <SessionReadyHero />
//   <SessionReadyRecap />
//   main: forecast + vocabulary | rail: streak, retention, leeches, vault
//   <SessionReadyHeatmap />
// </SessionReady>

import type { SessionSizeId } from '@/lib/essential-words/session-size'
import type { EssentialWordsCounts, EssentialWordsStats } from '@/hooks/useEssentialWordsSession'
import { useEssentialWordsReadyDashboard } from '@/hooks/useEssentialWordsReadyDashboard'
import { SessionReadyForecast } from './SessionReadyForecast'
import { SessionReadyHeatmap } from './SessionReadyHeatmap'
import { SessionReadyHero } from './SessionReadyHero'
import { SessionReadyLeeches } from './SessionReadyLeeches'
import { SessionReadyRecap } from './SessionReadyRecap'
import { SessionReadyRetention } from './SessionReadyRetention'
import { SessionReadyStreak } from './SessionReadyStreak'
import { SessionReadyVaultRow } from './SessionReadyVaultRow'
import { SessionReadyVocabulary } from './SessionReadyVocabulary'

interface Props {
  counts: EssentialWordsCounts
  stats: EssentialWordsStats
  streak: number
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
  sessionSize: SessionSizeId
  onSessionSizeChange: (id: SessionSizeId) => void
  onBegin: () => void
  onLeechReview: (wordIds: string[]) => void
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
  onLeechReview,
}: Props) {
  const isResume = counts.learningRemaining > 0
  const dashboard = useEssentialWordsReadyDashboard()

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

      {dashboard?.lastSession ? (
        <SessionReadyRecap session={dashboard.lastSession} />
      ) : null}

      <div className="flex flex-col gap-space-4 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(12rem,0.9fr)] md:items-start md:gap-space-4">
        <div className="order-1 flex flex-col gap-space-4">
          {dashboard ? <SessionReadyForecast days={dashboard.forecast} /> : null}
          {dashboard?.vocabulary ? (
            <SessionReadyVocabulary buckets={dashboard.vocabulary} />
          ) : null}
        </div>

        <aside className="order-2 flex flex-col gap-space-3" aria-label="Contexto">
          {dashboard ? (
            <SessionReadyStreak streak={streak} marks={dashboard.streakMarks} />
          ) : null}
          {dashboard?.retention ? (
            <SessionReadyRetention
              pct={dashboard.retention.pct}
              sampleSize={dashboard.retention.sampleSize}
            />
          ) : null}
          {dashboard ? (
            <SessionReadyLeeches leeches={dashboard.leeches} onReview={onLeechReview} />
          ) : null}
          <SessionReadyVaultRow />
        </aside>
      </div>

      {dashboard?.heatmap ? <SessionReadyHeatmap days={dashboard.heatmap} /> : null}
    </section>
  )
}
