'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEssentialWordsSession } from '@/hooks/useEssentialWordsSession'
import { useHideMobileNavDuringSession } from '@/hooks/useHideMobileNavDuringSession'
import { useLoadingWords } from '@/hooks/useLoadingWords'
import { WordStudyCard } from './WordStudyCard'
import { EssentialWordsExerciseCard } from './EssentialWordsExerciseCard'
import { SessionDone } from './SessionDone'
import { SessionReady } from './SessionReady'
import { EssentialWordsStudyChrome } from './EssentialWordsStudyChrome'
import { EssentialWordsPageHeader } from './EssentialWordsPageHeader'
import { EssentialWordsSessionToolbar } from './EssentialWordsSessionToolbar'
import { SessionShell, SessionSurface } from './session-chrome'
import { ExitConfirmSheet } from '@/components/exercises/ExitConfirmSheet'
import { WordCarousel } from '@/components/practice/session/WordCarousel'
import { getRoute } from '@/lib/essential-words/routes'
import { exerciseLevelLabel } from '@/lib/essential-words/level-labels'
import { attemptGrade, gradeToLegacyQuality, type AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import Button from '@/components/ui/Button'

export function EssentialWordsSession({ initialStreak = 0 }: { initialStreak?: number } = {}) {
  const {
    phase, currentStepId, current, currentMode, listeningTier, isListeningSkill, focusContrastId, retiredBlankKeys, currentExerciseLevel, audioDistractorPool, stats, counts,
    sessionProgress, studyContext, sessionSummary,
    strugglingWords, reloadLoading, levels, activeRouteId, setRoute,
    startSpeak, beginSession, omitWord, submitGrade, reload, learnMore, archiveWord,
    keepSnooze, masterWord,
    sessionSize, setSessionSize,
  } = useEssentialWordsSession()
  const loadingWords = useLoadingWords()
  const router = useRouter()
  const [loadingSlow, setLoadingSlow] = useState(false)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)
  const [pendingAttempt, setPendingAttempt] = useState<PendingAttempt | null>(null)
  const [isContinuing, setIsContinuing] = useState(false)
  const pendingAttemptRef = useRef<PendingAttempt | null>(null)
  const currentStepIdRef = useRef<string | null>(currentStepId)
  const continuingRef = useRef(false)
  currentStepIdRef.current = currentStepId

  // Immersive session chrome: reclaim the mobile viewport (PRODUCT: session is sacred).
  useHideMobileNavDuringSession()

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
  const studying = phase === 'study'
  const immersive = speaking || studying
  const exerciseLevelLabelText = currentExerciseLevel
    ? exerciseLevelLabel(currentExerciseLevel)
    : undefined
  const exitToHub = () => router.push('/')

  // Cards describe what happened; this is the only boundary that translates
  // that evidence into the legacy numeric scheduler input. Fase C can replace
  // this adapter with a Grade-consuming scheduler without touching a card.
  const handleAttempt = async (outcome: AttemptOutcome) => {
    const attemptStepId = currentStepId
    if (!attemptStepId || attemptStepId !== currentStepIdRef.current) return
    if (pendingAttemptRef.current?.stepId === attemptStepId) return
    const nextPendingAttempt = { stepId: attemptStepId, outcome }
    pendingAttemptRef.current = nextPendingAttempt
    setPendingAttempt(nextPendingAttempt)
  }

  // SpeakReviewCard already has an explicit "Guardar y ver la siguiente"
  // action after recording, so preserve that control as the advance boundary.
  const handleSpeakAttempt = async (outcome: AttemptOutcome) => {
    const attemptStepId = currentStepId
    if (!attemptStepId || attemptStepId !== currentStepIdRef.current) return
    const grade = attemptGrade(outcome)
    const quality = gradeToLegacyQuality(grade)
    await submitGrade(quality, undefined, attemptStepId, outcome)
  }

  const clearPendingAttempt = () => {
    pendingAttemptRef.current = null
    setPendingAttempt(null)
  }

  useEffect(() => {
    const pending = pendingAttemptRef.current
    if (!pending || pending.stepId === currentStepId) return
    pendingAttemptRef.current = null
    setPendingAttempt(null)
    continuingRef.current = false
    setIsContinuing(false)
  }, [currentStepId])

  const handleContinue = async () => {
    const pending = pendingAttemptRef.current
    if (!pending || pending.stepId !== currentStepIdRef.current || continuingRef.current) return
    continuingRef.current = true
    setIsContinuing(true)
    try {
      const grade = attemptGrade(pending.outcome)
      await submitGrade(gradeToLegacyQuality(grade), undefined, pending.stepId, pending.outcome)
      if (pendingAttemptRef.current?.stepId === pending.stepId) {
        pendingAttemptRef.current = null
        setPendingAttempt(null)
      }
    } catch (error) {
      console.error('[EssentialWordsSession] failed to continue', error)
    } finally {
      continuingRef.current = false
      setIsContinuing(false)
    }
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
      onConfirm={() => { setExitConfirmOpen(false); exitToHub() }}
      onCancel={() => setExitConfirmOpen(false)}
      title="¿Salir de la práctica?"
      description="Perderás el progreso de esta sesión."
      confirmLabel="Salir"
      cancelLabel="Seguir practicando"
    />
  )

  // One centered column for every phase, so content width never jumps as the
  // session moves loading → study → speak → done.
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
        <SessionShell className="min-h-[calc(100dvh-10rem)] gap-space-6 sm:min-h-[calc(100dvh-8rem)] sm:gap-space-8">
          {pageHeader}
          {sessionToolbar}
          <SessionReady
            counts={counts}
            stats={stats}
            streak={initialStreak}
            activeRouteId={activeRouteId}
            onRouteChange={(id) => void setRoute(id)}
            sessionSize={sessionSize}
            onSessionSizeChange={setSessionSize}
            onBegin={beginSession}
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
        {studying ? (
          <div className="flex min-h-[calc(100dvh-8rem)] flex-1 flex-col gap-layout-stack">
            <EssentialWordsStudyChrome
              current={sessionProgress?.current ?? 1}
              total={sessionProgress?.total ?? 1}
              onExit={() => setExitConfirmOpen(true)}
            />
            <div className="flex flex-1 flex-col items-center justify-center">
              {current && (
                <WordStudyCard
                  key={currentStepId ?? `study:${current.entry.word}`}
                  entry={current.entry}
                  contextLine={studyContext}
                  onContinue={startSpeak}
                  onOmit={omitWord}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[calc(100dvh-8rem)] flex-1 flex-col gap-layout-stack">
            <EssentialWordsStudyChrome
              current={sessionProgress?.current ?? 1}
              total={sessionProgress?.total ?? 1}
              onExit={() => setExitConfirmOpen(true)}
            />
            <div className="flex flex-1 flex-col items-center justify-center">
              {current && (
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
              )}
            </div>
          </div>
        )}
      </SessionShell>
      {exitSheet}
    </>
  )
}

interface PendingAttempt {
  stepId: string
  outcome: AttemptOutcome
}
