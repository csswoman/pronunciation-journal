'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEssentialWordsSession } from '@/hooks/useEssentialWordsSession'
import { useHideMobileNavDuringSession } from '@/hooks/useHideMobileNavDuringSession'
import { useLoadingWords } from '@/hooks/useLoadingWords'
import { WordStudyCard } from './WordStudyCard'
import { EssentialWordsExerciseCard } from './EssentialWordsExerciseCard'
import { SessionDone } from './SessionDone'
import { SessionReady } from './SessionReady'
import { EssentialWordsPageHeader } from './EssentialWordsPageHeader'
import { EssentialWordsSessionToolbar } from './EssentialWordsSessionToolbar'
import { EssentialWordsImmersivePhase } from './EssentialWordsImmersivePhase'
import { useSessionAttemptBridge } from './useSessionAttemptBridge'
import { SessionShell, SessionSurface } from './session-chrome'
import { ExitConfirmSheet } from '@/components/exercises/ExitConfirmSheet'
import { WordCarousel } from '@/components/practice/session/WordCarousel'
import { getRoute } from '@/lib/essential-words/routes'
import { exerciseLevelLabel } from '@/lib/essential-words/level-labels'
import Button from '@/components/ui/Button'

export function EssentialWordsSession({ initialStreak = 0 }: { initialStreak?: number } = {}) {
  const {
    phase, currentStepId, current, currentMode, listeningTier, isListeningSkill, focusContrastId, retiredBlankKeys, currentExerciseLevel, audioDistractorPool, stats,
    sessionProgress, sessionPreview, isResume, previewLoading, studyContext, sessionSummary,
    strugglingWords, reloadLoading, levels, activeRouteId, setRoute,
    startSpeak, beginSession, omitWord, submitGrade, reload, learnMore, archiveWord,
    keepSnooze, masterWord,
    sessionSize, setSessionSize, discardSession, pauseAndPersistSession, startLeechReview,
  } = useEssentialWordsSession()
  const loadingWords = useLoadingWords()
  const router = useRouter()
  const [loadingSlow, setLoadingSlow] = useState(false)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const {
    pendingAttempt,
    isContinuing,
    handleAttempt,
    handleSpeakAttempt,
    clearPendingAttempt,
    handleContinue,
  } = useSessionAttemptBridge(currentStepId, submitGrade)

  useHideMobileNavDuringSession()

  useEffect(() => {
    if (phase !== 'loading') {
      setLoadingSlow(false)
      return
    }
    const timeout = window.setTimeout(() => setLoadingSlow(true), 8000)
    return () => window.clearTimeout(timeout)
  }, [phase])

  const activeRoute = getRoute(activeRouteId)
  const selectionLabel = activeRoute
    ? `Cargando la ruta ${activeRoute.label}`
    : levels?.length === 1
      ? `Cargando palabras de nivel ${levels[0]}`
      : 'Cargando palabras para practicar'

  const speaking = phase === 'speak'
  const studying = phase === 'study'
  const immersive = speaking || studying
  const exerciseLevelLabelText = currentExerciseLevel
    ? exerciseLevelLabel(currentExerciseLevel)
    : undefined
  const exitToHub = async () => {
    await pauseAndPersistSession()
    router.push('/')
  }

  const pageHeader = immersive ? null : (
    <EssentialWordsPageHeader
      phase={phase}
      stats={stats}
      speaking={false}
      onExit={() => setExitConfirmOpen(true)}
    />
  )

  const sessionToolbar = immersive || phase === 'ready' ? null : <EssentialWordsSessionToolbar />

  const exitSheet = (
    <ExitConfirmSheet
      open={exitConfirmOpen}
      onConfirm={() => { setExitConfirmOpen(false); void exitToHub() }}
      onCancel={() => setExitConfirmOpen(false)}
      title="¿Salir de la práctica?"
      description="Tu progreso quedará guardado para que puedas continuar después."
      confirmLabel="Salir"
      cancelLabel="Seguir practicando"
    />
  )

  if (phase === 'loading') {
    return (
        <SessionShell>
          {pageHeader}
          {sessionToolbar}
          <SessionSurface className="flex min-h-[calc(100dvh-16rem)] flex-col items-center justify-center gap-space-6">
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
        </SessionSurface>
      </SessionShell>
    )
  }

  if (phase === 'ready') {
    return (
      <>
        <SessionShell className="min-h-[calc(100dvh-10rem)] max-w-[52rem] gap-space-6 sm:min-h-[calc(100dvh-8rem)] sm:gap-space-8">
          {pageHeader}
          {sessionToolbar}
          <SessionReady
            preview={sessionPreview!}
            stats={stats}
            streak={initialStreak}
            activeRouteId={activeRouteId}
            onRouteChange={(id) => void setRoute(id)}
            sessionSize={sessionSize}
            onSessionSizeChange={setSessionSize}
            onBegin={beginSession}
            isResume={isResume}
            previewLoading={previewLoading}
            onDiscard={discardSession}
            onLeechReview={startLeechReview}
          />
        </SessionShell>
        {exitSheet}
      </>
    )
  }

  if (phase === 'empty' || phase === 'done' || phase === 'error') {
    return (
      <>
        <SessionShell>
          {pageHeader}
          {sessionToolbar}
          <SessionSurface>
            <SessionDone
              stats={stats}
              sessionSummary={sessionSummary}
              wasEmpty={phase === 'empty'}
              loadFailed={phase === 'error'}
              onContinue={reload}
              continueLoading={reloadLoading}
              onLearnMore={phase === 'done' ? learnMore : undefined}
              strugglingWords={strugglingWords}
            />
          </SessionSurface>
        </SessionShell>
        {exitSheet}
      </>
    )
  }

  return (
    <>
      <SessionShell className={immersive ? 'min-h-[calc(100dvh-6rem)]' : undefined}>
        <EssentialWordsImmersivePhase
          sessionCurrent={sessionProgress?.current ?? 1}
          sessionTotal={sessionProgress?.total ?? 1}
          onExit={() => setExitConfirmOpen(true)}
        >
          {studying && current ? (
            <WordStudyCard
              key={currentStepId ?? `study:${current.entry.word}`}
              entry={current.entry}
              contextLine={studyContext}
              onContinue={startSpeak}
              onOmit={omitWord}
            />
          ) : null}
          {!studying && current ? (
            <EssentialWordsExerciseCard
              current={current}
              currentMode={currentMode}
              listeningTier={listeningTier}
              isListeningSkill={isListeningSkill}
              focusContrastId={focusContrastId}
              retiredBlankKeys={retiredBlankKeys}
              currentStepId={currentStepId}
              levelLabel={exerciseLevelLabelText}
              audioDistractorPool={audioDistractorPool}
              onAttempt={handleAttempt}
              onSpeakAttempt={handleSpeakAttempt}
              onRetry={clearPendingAttempt}
              onContinue={pendingAttempt?.stepId === currentStepId ? () => void handleContinue() : undefined}
              isContinuing={isContinuing}
              onArchive={() => void archiveWord(current.entry.word)}
              onKeepSnooze={() => void keepSnooze(current.entry.word)}
              onMaster={() => void masterWord(current.entry.word)}
              isAdvancedListening={isListeningSkill && listeningTier === 3}
            />
          ) : null}
        </EssentialWordsImmersivePhase>
      </SessionShell>
      {exitSheet}
    </>
  )
}
