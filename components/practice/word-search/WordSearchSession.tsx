'use client'

import { useEffect, useRef, useState } from 'react'
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
import { PillButton } from '@/components/ui/PillButton'
import { getWordColorTheme } from '@/lib/exercises/word-search/word-colors'
import WordSearchSetupView from './WordSearchSetupView'
import WordSearchGrid from './WordSearchGrid'
import WordClueList from './WordClueList'
import WordFoundBanner from './WordFoundBanner'
import WordSearchCompletion from './WordSearchCompletion'
import WordSearchProgressBar from './WordSearchProgressBar'
import {
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
    return <WordSearchSetupView onStartPuzzle={handleStartPuzzle} />
  }

  const itemsWithFoundState: WordSearchItem[] = puzzle.items.map((item) => ({
    ...item,
    found: foundWordIds.has(item.id),
  }))
  const progressPercent = Math.round(
    (foundWordIds.size / Math.max(puzzle.items.length, 1)) * 100,
  )
  const modeLabel = puzzle.mode === 'classic' ? 'Lista visible' : 'Con pistas'
  const lastFoundIndex = lastFoundItem
    ? puzzle.items.findIndex((item) => item.id === lastFoundItem.id)
    : -1
  const lastFoundTheme = lastFoundIndex >= 0 ? getWordColorTheme(lastFoundIndex) : undefined

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

      <WordSearchProgressBar
        foundCount={foundWordIds.size}
        totalCount={puzzle.items.length}
        progressPercent={progressPercent}
        isCompleted={isCompleted}
      />

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>

      {isCompleted ? (
        <WordSearchCompletion
          puzzle={puzzle}
          elapsedSeconds={elapsedSeconds}
          formatTime={formatTime}
          onRepeat={() => handleStartPuzzle(puzzle)}
          onExit={handleExitSession}
        />
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

          <div className="flex min-w-0 flex-col gap-3">
            {lastFoundItem ? (
              <WordFoundBanner
                item={lastFoundItem}
                colorTheme={lastFoundTheme}
                onDismiss={() => setLastFoundItem(null)}
              />
            ) : null}

            <WordClueList
              key={`clues-${runId}`}
              items={itemsWithFoundState}
              mode={puzzle.mode}
              activeWordId={activeWordId}
              onInspectWord={setActiveWordId}
            />
          </div>
        </div>
      )}
    </div>
  )
}
