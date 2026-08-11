'use client'

// Planned structure:
// <SessionReady>
//   <SessionReadyHero /> (full width)
//   <SessionReadyRecap />
//   main: forecast + vocabulary + vault | rail: streak, retention, leeches, heatmap
// </SessionReady>

import type { SessionSizeId } from '@/lib/essential-words/session-size'
import type { EssentialWordsStats } from '@/hooks/useEssentialWordsSession'
import type { EssentialWordsSessionPreview } from '@/lib/essential-words/action-session'
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
  preview: EssentialWordsSessionPreview
  stats: EssentialWordsStats
  streak: number
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
  sessionSize: SessionSizeId
  onSessionSizeChange: (id: SessionSizeId) => void
  onBegin: () => void
  isResume: boolean
  previewLoading: boolean
  onDiscard: () => void
  onLeechReview: (wordIds: string[]) => void
}

export function SessionReady({
  preview,
  stats,
  streak,
  activeRouteId,
  onRouteChange,
  sessionSize,
  onSessionSizeChange,
  onBegin,
  isResume,
  previewLoading,
  onDiscard,
  onLeechReview,
}: Props) {
  const dashboard = useEssentialWordsReadyDashboard()

  return (
    <section
      aria-labelledby="session-ready-title"
      className="flex w-full flex-col gap-space-4 sm:gap-space-5"
    >
      <SessionReadyHero
        preview={preview}
        isResume={isResume}
        activeRouteId={activeRouteId}
        onRouteChange={onRouteChange}
        sessionSize={sessionSize}
        onSessionSizeChange={onSessionSizeChange}
        onBegin={onBegin}
        onDiscard={onDiscard}
        previewLoading={previewLoading}
      />

      {dashboard?.lastSession ? (
        <SessionReadyRecap session={dashboard.lastSession} />
      ) : null}

      <div className="flex flex-col gap-space-3 md:grid md:grid-cols-[minmax(0,1fr)_minmax(12.5rem,15rem)] md:items-start md:gap-space-3">
        <div className="flex min-w-0 flex-col gap-space-3 animate-home-in animate-home-in-d1">
          {dashboard ? <SessionReadyForecast days={dashboard.forecast} /> : null}
          {dashboard?.vocabulary ? (
            <SessionReadyVocabulary
              buckets={dashboard.vocabulary}
              totalWords={stats.totalWords}
            />
          ) : null}
          <SessionReadyVaultRow />
        </div>

        <aside
          className="flex min-w-0 flex-col gap-space-3 animate-home-in animate-home-in-d2"
          aria-label="Contexto"
        >
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
            <SessionReadyLeeches
              leeches={dashboard.leeches}
              onReview={onLeechReview}
              disabled={isResume || previewLoading}
            />
          ) : null}
          {dashboard?.heatmap ? <SessionReadyHeatmap days={dashboard.heatmap} /> : null}
        </aside>
      </div>
    </section>
  )
}
