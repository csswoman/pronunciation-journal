'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useEssentialWordsSession } from '@/hooks/useEssentialWordsSession'
import { useLoadingWords } from '@/hooks/useLoadingWords'
import { SessionStatsCard } from './SessionStatsCard'
import { WordStudyCard } from './WordStudyCard'
import { SpeakReviewCard } from './SpeakReviewCard'
import { SessionDone } from './SessionDone'
import { LevelFilterBar } from './LevelFilterBar'
import { RoutePicker } from './RoutePicker'
import { WordCarousel } from '@/components/practice/session/WordCarousel'
import { getRoute } from '@/lib/core-1000/routes'

export function EssentialWordsSession() {
  const {
    phase, current, stats, counts, sessionSummary,
    reloadLoading, levels, setLevels, activeRouteId, setRoute,
    startSpeak, submitGrade, reload, learnMore, archiveWord,
    keepSnooze, masterWord,
  } = useEssentialWordsSession()
  const loadingWords = useLoadingWords()

  // A guided route drives level + part of speech. Otherwise, the learner can
  // optionally refine their recommended CEFR level.
  const activeRoute = getRoute(activeRouteId)
  const isLoading = phase === 'loading'
  const selectionLabel = activeRoute
    ? `Cargando la ruta ${activeRoute.label}`
    : levels?.length === 1
      ? `Cargando palabras de nivel ${levels[0]}`
      : 'Cargando palabras para practicar'

  const filters = (
    <div className="flex flex-col items-center gap-3">
      <RoutePicker
        value={activeRouteId}
        onChange={(id) => void setRoute(id)}
        disabled={isLoading}
      />
      {!activeRouteId && (
        <LevelFilterBar
          value={levels}
          onChange={(l) => void setLevels(l)}
          disabled={isLoading}
        />
      )}
      {isLoading && <p className="m-0 text-caption text-fg-subtle">{selectionLabel}</p>}
    </div>
  )

  // One centered column for every phase, so content width never jumps as the
  // session moves loading → study → speak → done.
  if (phase === 'loading') {
    return (
      <Frame className="min-h-[calc(100vh-10rem)] justify-center">
        <div className="mb-4">{filters}</div>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {selectionLabel}
        </p>
        <WordCarousel words={loadingWords} />
      </Frame>
    )
  }

  if (phase === 'empty' || phase === 'done' || phase === 'error') {
    return (
      <Frame>
        <div className="mb-4">{filters}</div>
        <SessionDone
          stats={stats}
          sessionSummary={sessionSummary}
          wasEmpty={phase === 'empty'}
          loadFailed={phase === 'error'}
          onContinue={reload}
          continueLoading={reloadLoading}
          onLearnMore={phase === 'done' ? learnMore : undefined}
        />
      </Frame>
    )
  }

  return (
    <Frame>
      <div className="mb-3">{filters}</div>
      <SessionStatsCard stats={stats} counts={counts} />

      <div className="mt-4 flex flex-col items-center">
        {phase === 'study' && current && (
          <WordStudyCard
            entry={current.entry}
            onContinue={startSpeak}
            onArchive={() => void archiveWord(current.entry.word)}
          />
        )}
        {phase === 'speak' && current && (
          <SpeakReviewCard
            entry={current.entry}
            onGraded={submitGrade}
            onArchive={() => void archiveWord(current.entry.word)}
            fromSnooze={current.fromSnooze}
            onKeepSnooze={() => void keepSnooze(current.entry.word)}
            onMaster={() => void masterWord(current.entry.word)}
          />
        )}
      </div>
    </Frame>
  )
}

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto flex w-full max-w-md flex-col', className)}>
      {children}
    </div>
  )
}
