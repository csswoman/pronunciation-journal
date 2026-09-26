'use client'

import type { SessionSizeId } from '@/lib/essential-words/session-size'
import type { EssentialWordsStats } from '@/hooks/useEssentialWordsSession'
import type { EssentialWordsSessionPreview } from '@/lib/essential-words/action-session'
import { useEssentialWordsReadyDashboard } from '@/hooks/useEssentialWordsReadyDashboard'
import { SessionReadyHero } from './SessionReadyHero'
import { SessionReadyVaultRow } from './SessionReadyVaultRow'
import { SessionReadyVocabulary } from './SessionReadyVocabulary'

interface Props {
  preview: EssentialWordsSessionPreview
  stats: EssentialWordsStats
  streak?: number
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
  sessionSize: SessionSizeId
  onSessionSizeChange: (id: SessionSizeId) => void
  onBegin: () => void
  isResume: boolean
  previewLoading: boolean
  onDiscard: () => void
}

const DEFAULT_VOCAB_BUCKETS = { nuevas: 2, aprendiendo: 0, en_repaso: 0, dominadas: 0 }

export function SessionReady({
  preview,
  stats,
  activeRouteId,
  onRouteChange,
  sessionSize,
  onSessionSizeChange,
  onBegin,
  isResume,
  previewLoading,
  onDiscard,
}: Props) {
  const dashboard = useEssentialWordsReadyDashboard()

  return (
    <section
      aria-labelledby="session-ready-title"
      className="flex w-full flex-col gap-6"
    >
      {/* Main 2-column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-6 items-start">
        {/* Left Column: Coral Session Hero Card */}
        <div className="w-full">
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
            lastSession={dashboard?.lastSession}
          />
        </div>

        {/* Right Column: Stacked Cards (Tu Vocabulario, Tu Baúl) */}
        <aside
          className="flex flex-col gap-4 w-full"
          aria-label="Progreso y Vocabulario"
        >
          <SessionReadyVocabulary
            buckets={dashboard?.vocabulary ?? DEFAULT_VOCAB_BUCKETS}
            totalWords={stats.totalWords || 2800}
          />
          <SessionReadyVaultRow />
        </aside>
      </div>
    </section>
  )
}

