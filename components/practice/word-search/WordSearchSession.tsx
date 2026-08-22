'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type {
  CellCoordinate,
  WordSearchItem,
  WordSearchPuzzle,
  WordSelectionResult,
} from '@/lib/exercises/word-search/types'
import { checkWordMatch } from '@/lib/exercises/word-search/grid-generator'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { useHideMobileNavDuringSession } from '@/hooks/useHideMobileNavDuringSession'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { PillButton } from '@/components/ui/PillButton'
import WordSearchSetup from './WordSearchSetup'
import WordSearchGrid from './WordSearchGrid'
import WordClueList from './WordClueList'
import WordFoundBanner from './WordFoundBanner'
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Timer as TimerIcon,
  X,
} from '@/components/icons'

function ActiveSessionChrome() {
  useHideMobileNavDuringSession()
  return null
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export default function WordSearchSession() {
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle | null>(null)
  const [runId, setRunId] = useState(0)
  const [foundWordIds, setFoundWordIds] = useState<Set<string>>(new Set())
  const [activeWordId, setActiveWordId] = useState<string | null>(null)
  const [lastFoundItem, setLastFoundItem] = useState<WordSearchItem | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const sessionStartRef = useRef<HTMLDivElement>(null)

  const isCompleted = Boolean(
    puzzle &&
      puzzle.items.length > 0 &&
      foundWordIds.size === puzzle.items.length,
  )

  useEffect(() => {
    if (!puzzle || isCompleted) return

    const timer = window.setInterval(() => {
      setElapsedSeconds((previous) => previous + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [puzzle, runId, isCompleted])

  useEffect(() => {
    if (!puzzle) return
    const frame = window.requestAnimationFrame(() => {
      sessionStartRef.current?.scrollIntoView({ block: 'start' })
      sessionStartRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [puzzle, runId])

  const handleStartPuzzle = (nextPuzzle: WordSearchPuzzle) => {
    setPuzzle(nextPuzzle)
    setRunId((current) => current + 1)
    setFoundWordIds(new Set())
    setActiveWordId(null)
    setLastFoundItem(null)
    setElapsedSeconds(0)
    setStatusMessage(
      `Partida lista. Encuentra ${nextPuzzle.items.length} palabras en el tablero.`,
    )
  }

  const handleExitSession = () => {
    setPuzzle(null)
    setFoundWordIds(new Set())
    setActiveWordId(null)
    setLastFoundItem(null)
    setElapsedSeconds(0)
    setStatusMessage('')
  }

  const handleSelectPath = (path: CellCoordinate[]): WordSelectionResult => {
    if (!puzzle || isCompleted) return 'invalid'

    const matchedWordId = checkWordMatch(path, puzzle.placements)
    if (!matchedWordId) {
      playUiCue('soft')
      setStatusMessage('Esa línea no forma una de las palabras. Prueba otra dirección.')
      return 'invalid'
    }

    if (foundWordIds.has(matchedWordId)) {
      const repeatedItem = puzzle.items.find((item) => item.id === matchedWordId)
      setActiveWordId(matchedWordId)
      setStatusMessage(
        repeatedItem
          ? `Ya encontraste ${repeatedItem.displayWord}.`
          : 'Esa palabra ya estaba encontrada.',
      )
      return 'already-found'
    }

    const item = puzzle.items.find((candidate) => candidate.id === matchedWordId)
    if (!item) return 'invalid'

    const nextFoundCount = foundWordIds.size + 1
    playUiCue('correct')
    setFoundWordIds((current) => {
      const next = new Set(current)
      next.add(matchedWordId)
      return next
    })
    setLastFoundItem(item)
    setActiveWordId(null)
    setStatusMessage(
      `Encontraste ${item.displayWord}. ${nextFoundCount} de ${puzzle.items.length}.`,
    )
    return 'found'
  }

  if (!puzzle) {
    return (
      <div
        id="word-search-setup"
        className="mx-auto flex w-full max-w-[var(--layout-session-max)] flex-col gap-layout-section-gap"
      >
        <Link
          href="/practice"
          className="focus-ring inline-flex min-h-11 w-fit items-center gap-1.5 rounded-sm text-caption text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span>Volver a Práctica</span>
        </Link>
        <PageHeader
          kicker="Práctica de vocabulario"
          title="Sopa de letras"
          subtitle="Encuentra seis palabras, descifra pistas y escucha su pronunciación al descubrirlas."
        />
        <WordSearchSetup onStartPuzzle={handleStartPuzzle} />
      </div>
    )
  }

  const itemsWithFoundState: WordSearchItem[] = puzzle.items.map((item) => ({
    ...item,
    found: foundWordIds.has(item.id),
  }))
  const progressPercent = Math.round(
    (foundWordIds.size / Math.max(puzzle.items.length, 1)) * 100,
  )
  const modeLabel = puzzle.mode === 'classic' ? 'Lista visible' : 'Con pistas'

  return (
    <div
      ref={sessionStartRef}
      tabIndex={-1}
      className="flex w-full flex-col gap-layout-section-gap outline-none"
    >
      <ActiveSessionChrome />
      <PageHeader
        variant="compact"
        kicker={`Sopa de letras · ${modeLabel}`}
        title={puzzle.title}
        subtitle={puzzle.topic}
        actions={
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-surface-sunken px-3 font-mono text-caption tabular-nums text-fg-muted"
              aria-label={`Tiempo transcurrido: ${formatTime(elapsedSeconds)}`}
            >
              <TimerIcon className="h-4 w-4" aria-hidden />
              {formatTime(elapsedSeconds)}
            </span>
            <PillButton
              variant="outline"
              size="sm"
              className="min-h-11 min-w-11 px-0"
              onClick={() => handleStartPuzzle(puzzle)}
              aria-label="Reiniciar este tablero"
              title="Reiniciar este tablero"
              icon={<RotateCcw className="h-4 w-4" aria-hidden />}
            />
            <PillButton
              variant="quiet"
              size="sm"
              className="min-h-11 min-w-11 px-0"
              onClick={handleExitSession}
              aria-label="Salir de la partida"
              title="Salir de la partida"
              icon={<X className="h-4 w-4" aria-hidden />}
            />
          </div>
        }
      />

      <div className="flex flex-col gap-2" aria-label="Progreso de la partida">
        <div className="flex items-center justify-between gap-3 text-caption text-fg-muted">
          <span>{isCompleted ? 'Partida completada' : 'Palabras encontradas'}</span>
          <span className="font-mono tabular-nums text-fg">
            {foundWordIds.size} / {puzzle.items.length}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Palabras encontradas"
          aria-valuemin={0}
          aria-valuemax={puzzle.items.length}
          aria-valuenow={foundWordIds.size}
          className="h-1.5 overflow-hidden rounded-full bg-surface-sunken"
        >
          <div
            className="h-full rounded-full bg-success transition-[width] duration-200 ease-out-quart motion-reduce:transition-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>

      {!isCompleted ? (
        <WordFoundBanner
          item={lastFoundItem}
          onDismiss={() => setLastFoundItem(null)}
        />
      ) : null}

      {isCompleted ? (
        <section className="flex flex-col items-center justify-center gap-layout-section-gap rounded-lg border border-success/30 bg-success-soft p-layout-card-pad text-center md:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-on-primary">
            <CheckCircle2 className="h-7 w-7" aria-hidden />
          </div>

          <div className="flex flex-col gap-layout-stack-tight">
            <h2 className="text-balance text-h3 font-bold text-fg">
              ¡Encontraste todas!
            </h2>
            <p className="max-w-md text-pretty text-body-sm text-fg-muted">
              Completaste “{puzzle.title}” en{' '}
              <span className="font-semibold tabular-nums text-fg">
                {formatTime(elapsedSeconds)}
              </span>
              . Repasa las palabras que encontraste o vuelve a jugar el mismo tablero.
            </p>
          </div>

          <div className="flex max-w-lg flex-wrap justify-center gap-2" aria-label="Palabras encontradas">
            {puzzle.items.map((item) => (
              <span
                key={item.id}
                className="rounded-sm bg-surface-raised px-2.5 py-1 text-caption font-medium text-fg"
              >
                {item.displayWord}
                {item.ipa ? (
                  <span className="ms-1 font-ipa text-caption text-fg-muted">
                    {item.ipa}
                  </span>
                ) : null}
              </span>
            ))}
          </div>

          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:gap-3">
            <Button variant="secondary" onClick={() => handleStartPuzzle(puzzle)}>
              <RotateCcw className="me-1.5 h-4 w-4" aria-hidden />
              <span>Repetir tablero</span>
            </Button>
            <Button variant="primary" onClick={handleExitSession}>
              <ArrowLeft className="me-1.5 h-4 w-4" aria-hidden />
              <span>Elegir otro tema</span>
            </Button>
          </div>
        </section>
      ) : (
        <div className="grid w-full items-start gap-layout-section-gap lg:grid-cols-[minmax(22rem,32rem)_minmax(20rem,1fr)]">
          <div className="min-w-0 lg:sticky lg:top-6">
            <WordSearchGrid
              key={`grid-${runId}`}
              grid={puzzle.grid}
              placements={puzzle.placements}
              foundWordIds={foundWordIds}
              activeWordId={activeWordId}
              onSelectPath={handleSelectPath}
            />
          </div>

          <WordClueList
            key={`clues-${runId}`}
            items={itemsWithFoundState}
            mode={puzzle.mode}
            activeWordId={activeWordId}
            onInspectWord={setActiveWordId}
          />
        </div>
      )}
    </div>
  )
}
