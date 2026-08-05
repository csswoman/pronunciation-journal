'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/cn'
import { useEssentialWordsSession } from '@/hooks/useEssentialWordsSession'
import { useHideMobileNavDuringSession } from '@/hooks/useHideMobileNavDuringSession'
import { useLoadingWords } from '@/hooks/useLoadingWords'
import { SessionStatsCard } from './SessionStatsCard'
import { WordStudyCard } from './WordStudyCard'
import { SpeakReviewCard } from './SpeakReviewCard'
import { RecognizeCard } from './RecognizeCard'
import { RecognizeAudioCard } from './RecognizeAudioCard'
import { DictationCard } from './DictationCard'
import { WeakFormCard } from './WeakFormCard'
import { ClozeCard } from './ClozeCard'
import { RecallTranslationCard } from './RecallTranslationCard'
import { SessionDone } from './SessionDone'
import { SessionReady } from './SessionReady'
import { EssentialWordsChrome } from './EssentialWordsChrome'
import { ExitConfirmSheet } from '@/components/exercises/ExitConfirmSheet'
import { WordCarousel } from '@/components/practice/session/WordCarousel'
import { getRoute } from '@/lib/essential-words/routes'
import { attemptGrade, gradeToLegacyQuality, type AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import Button from '@/components/ui/Button'

export function EssentialWordsSession() {
  const {
    phase, current, currentMode, distractorPool, stats, counts, sessionSummary,
    strugglingWords, reloadLoading, levels, activeRouteId, setRoute,
    startSpeak, beginSession, submitGrade, reload, learnMore, archiveWord,
    keepSnooze, masterWord,
  } = useEssentialWordsSession()
  const loadingWords = useLoadingWords()
  const router = useRouter()
  const [loadingSlow, setLoadingSlow] = useState(false)
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false)

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
  const exitToHub = () => router.push('/')

  // Cards describe what happened; this is the only boundary that translates
  // that evidence into the legacy numeric scheduler input. Fase C can replace
  // this adapter with a Grade-consuming scheduler without touching a card.
  const handleAttempt = async (outcome: AttemptOutcome) => {
    const grade = attemptGrade(outcome)
    const quality = gradeToLegacyQuality(grade)
    await submitGrade(quality)
  }

  const chrome = (
    <EssentialWordsChrome
      speaking={speaking}
      onExit={() => setExitConfirmOpen(true)}
      activeRouteId={activeRouteId}
      onRouteChange={(id) => void setRoute(id)}
    />
  )

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
  // Immersive prep: only the carousel — chrome (kicker, vault, settings) waits
  // until the session actually starts so the loader isn't competing with chrome.
  if (phase === 'loading') {
    return (
      <Frame className="min-h-[calc(100dvh-10rem)] items-center justify-center">
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

  if (phase === 'ready') {
    return (
      <>
        <Frame>
          {chrome}
          <SessionReady counts={counts} vaulted={stats.vaulted} onBegin={beginSession} />
        </Frame>
        {exitSheet}
      </>
    )
  }

  if (phase === 'empty' || phase === 'done' || phase === 'error') {
    return (
      <>
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
        {exitSheet}
      </>
    )
  }

  return (
    <>
      <Frame className={speaking ? 'min-h-[calc(100dvh-6rem)]' : undefined}>
        <div className="flex flex-col gap-layout-stack">
          {chrome}
          {!speaking && <SessionStatsCard stats={stats} counts={counts} />}
        </div>

        <div
          className={cn(
            'flex w-full flex-col items-center',
            speaking && 'flex-1 justify-center',
          )}
        >
          {phase === 'study' && current && (
            <WordStudyCard
              entry={current.entry}
              onContinue={startSpeak}
              onArchive={() => void archiveWord(current.entry.word)}
            />
          )}
          {phase === 'speak' && current && (
            <>
              {currentMode === 'recognize_translation' && (
                <RecognizeCard
                  entry={current.entry}
                  prompt={current.entry.translation!}
                  distractors={distractorPool}
                  onAttempt={handleAttempt}
                />
              )}
              {currentMode === 'recognize_meaning' && (
                <RecognizeCard
                  entry={current.entry}
                  prompt={current.entry.meaning!}
                  distractors={distractorPool}
                  onAttempt={handleAttempt}
                />
              )}
              {currentMode === 'recognize_audio' && (
                <RecognizeAudioCard
                  entry={current.entry}
                  distractors={distractorPool}
                  onAttempt={handleAttempt}
                />
              )}
              {currentMode === 'dictation_sentence' && (
                <DictationCard
                  entry={current.entry}
                  repetitions={current.repetitions ?? 0}
                  onAttempt={handleAttempt}
                />
              )}
              {currentMode === 'weak_form' && (
                <WeakFormCard
                  entry={current.entry}
                  repetitions={current.repetitions ?? 0}
                  onAttempt={handleAttempt}
                />
              )}
              {currentMode === 'cloze_sentence' && (
                <ClozeCard
                  entry={current.entry}
                  repetitions={current.repetitions ?? 0}
                  onAttempt={handleAttempt}
                />
              )}
              {currentMode === 'recall_translation' && (
                <RecallTranslationCard
                  entry={current.entry}
                  repetitions={current.repetitions ?? 0}
                  onAttempt={handleAttempt}
                />
              )}
              {/* 'study' mode belongs to the study phase's WordStudyCard; a new
                  word reaching the speak phase (post-study) still falls back
                  to full production here. */}
              {(currentMode === 'speak_sentence' || currentMode === 'study') && (
                <SpeakReviewCard
                  entry={current.entry}
                  repetitions={current.repetitions ?? 0}
                  onAttempt={handleAttempt}
                  onArchive={() => void archiveWord(current.entry.word)}
                  fromSnooze={current.fromSnooze}
                  onKeepSnooze={() => void keepSnooze(current.entry.word)}
                  onMaster={() => void masterWord(current.entry.word)}
                />
              )}
            </>
          )}
        </div>
      </Frame>
      {exitSheet}
    </>
  )
}

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative mx-auto flex w-full max-w-layout-session-max flex-col gap-space-6 sm:gap-space-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
