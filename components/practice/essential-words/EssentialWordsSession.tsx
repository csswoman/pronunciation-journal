'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { useEssentialWordsSession } from '@/hooks/useEssentialWordsSession'
import { useLoadingWords } from '@/hooks/useLoadingWords'
import { SessionStatsCard } from './SessionStatsCard'
import { WordStudyCard } from './WordStudyCard'
import { SpeakReviewCard } from './SpeakReviewCard'
import { SessionDone } from './SessionDone'
import { EssentialWordsChrome } from './EssentialWordsChrome'
import { ExitConfirmSheet } from '@/components/exercises/ExitConfirmSheet'
import { WordCarousel } from '@/components/practice/session/WordCarousel'
import { getRoute } from '@/lib/essential-words/routes'
import Button from '@/components/ui/Button'

export function EssentialWordsSession() {
  const {
    phase, current, stats, counts, sessionSummary,
    reloadLoading, levels, activeRouteId, setRoute,
    startSpeak, submitGrade, reload, learnMore, archiveWord,
    keepSnooze, masterWord,
  } = useEssentialWordsSession()
  const loadingWords = useLoadingWords()
  const router = useRouter()
  const [loadingSlow, setLoadingSlow] = useState(false)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)

  useEffect(() => {
    if (phase !== 'loading') {
      setLoadingSlow(false)
      return
    }
    const timeout = window.setTimeout(() => setLoadingSlow(true), 8000)
    return () => window.clearTimeout(timeout)
  }, [phase])

  // A guided route drives level + part of speech. Otherwise, the learner can
  // optionally refine their recommended CEFR level.
  const activeRoute = getRoute(activeRouteId)
  const selectionLabel = activeRoute
    ? `Cargando la ruta ${activeRoute.label}`
    : levels?.length === 1
      ? `Cargando palabras de nivel ${levels[0]}`
      : 'Cargando palabras para practicar'

  const speaking = phase === 'speak'
  const exitToHub = () => router.push('/')

  const chrome = (
    <>
      <EssentialWordsChrome
        speaking={speaking}
        onExit={() => setExitConfirmOpen(true)}
        activeRouteId={activeRouteId}
        onRouteChange={(id) => void setRoute(id)}
      />
      <ExitConfirmSheet
        open={exitConfirmOpen}
        onConfirm={() => { setExitConfirmOpen(false); exitToHub() }}
        onCancel={() => setExitConfirmOpen(false)}
        title="¿Salir de la práctica?"
        description="Perderás el progreso de esta sesión."
        confirmLabel="Salir"
        cancelLabel="Seguir practicando"
      />
    </>
  )

  // One centered column for every phase, so content width never jumps as the
  // session moves loading → study → speak → done.
  // Immersive prep: only the carousel — chrome (kicker, vault, settings) waits
  // until the session actually starts so the loader isn't competing with chrome.
  if (phase === 'loading') {
    return (
      <Frame className="min-h-[calc(100vh-10rem)] justify-center">
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {selectionLabel}
        </p>
        <WordCarousel words={loadingWords} />
        {loadingSlow && (
          <div className="flex max-w-[36ch] flex-col items-center gap-2 text-center">
            <p className="m-0 text-caption text-fg-muted">
              La carga está tardando más de lo normal.
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={() => void reload()}>
              Reintentar carga
            </Button>
          </div>
        )}
      </Frame>
    )
  }

  if (phase === 'empty' || phase === 'done' || phase === 'error') {
    return (
      <Frame>
        {chrome}
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
      {chrome}
      {!speaking && (
        <div className="mb-3 flex w-full flex-col gap-2">
          <SessionStatsCard stats={stats} counts={counts} />
        </div>
      )}

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
  return <div className={cn('relative mx-auto flex w-full max-w-[var(--layout-session-max)] flex-col', className)}>{children}</div>
}
