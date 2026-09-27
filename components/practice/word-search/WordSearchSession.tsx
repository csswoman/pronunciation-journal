'use client'

// Planned structure:
// <WordSearchSession initialPuzzle onExit>
//   <ActiveSessionChrome />
//   <WordSearchHeader />
//   <ScreenReaderStatus />
//   <SessionContentGrid>
//     <WordSearchGrid />    (Tablero card con banner de última palabra en la parte inferior)
//     <WordClueList />      (Pistas card con botón "Ver una letra")
//   </SessionContentGrid>
//   <WordSearchCompletion />
// </WordSearchSession>

import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  CellCoordinate,
  WordSearchItem,
  WordSearchPuzzle,
  WordSelectionResult,
} from '@/lib/exercises/word-search/types'
import { checkWordMatch } from '@/lib/exercises/word-search/grid-generator'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { useHideMobileNavDuringSession } from '@/hooks/useHideMobileNavDuringSession'
import { useWordSearchHints } from '@/hooks/useWordSearchHints'
import WordSearchHeader from './WordSearchHeader'
import WordSearchGrid from './WordSearchGrid'
import WordClueList from './WordClueList'
import WordSearchCompletion from './WordSearchCompletion'

function ActiveSessionChrome() {
  useHideMobileNavDuringSession()
  return null
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

interface Props {
  /** Board configured in the games hub (/practice/games). */
  initialPuzzle: WordSearchPuzzle
  /** Returns to the games hub to pick another board. */
  onExit: () => void
}

export default function WordSearchSession({ initialPuzzle, onExit }: Props) {
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle>(initialPuzzle)
  const [runId, setRunId] = useState(1)
  const [foundWordIds, setFoundWordIds] = useState<Set<string>>(new Set())
  const [activeWordId, setActiveWordId] = useState<string | null>(null)
  const [lastFoundItem, setLastFoundItem] = useState<WordSearchItem | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [statusMessage, setStatusMessage] = useState(
    `Partida lista. Encuentra ${initialPuzzle.items.length} palabras en el tablero.`,
  )
  const sessionStartRef = useRef<HTMLDivElement>(null)
  const { hintCells, hintTargetId, hintProgress, revealLetter, resetHints } =
    useWordSearchHints(puzzle, foundWordIds)

  const isCompleted =
    puzzle.items.length > 0 && foundWordIds.size === puzzle.items.length

  useEffect(() => {
    if (isCompleted) return

    const timer = window.setInterval(() => {
      setElapsedSeconds((previous) => previous + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [puzzle, runId, isCompleted])

  useEffect(() => {
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
    resetHints()
    setStatusMessage(
      `Partida lista. Encuentra ${nextPuzzle.items.length} palabras en el tablero.`,
    )
  }

  const handleExitSession = () => {
    resetHints()
    onExit()
  }


  const handleSelectPath = (path: CellCoordinate[]): WordSelectionResult => {
    if (isCompleted) return 'invalid'

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

  const handleRevealLetter = () => {
    const hintedId = revealLetter()
    playUiCue('soft')
    if (!hintedId) {
      setStatusMessage('Ya no quedan letras por revelar.')
      return
    }
    setActiveWordId(null)
    const index = puzzle.items.findIndex((item) => item.id === hintedId)
    setStatusMessage(`Pista: se ilumina una letra más de la palabra ${index + 1}.`)
  }

  const inspectedCells = useMemo(
    () =>
      activeWordId
        ? puzzle.placements.find((item) => item.wordId === activeWordId)?.path ?? []
        : [],
    [activeWordId, puzzle],
  )
  const highlightedCells = useMemo(
    () => [...inspectedCells, ...hintCells],
    [inspectedCells, hintCells],
  )

  const itemsWithFoundState: WordSearchItem[] = puzzle.items.map((item) => ({
    ...item,
    found: foundWordIds.has(item.id),
  }))
  const progressPercent = Math.round(
    (foundWordIds.size / Math.max(puzzle.items.length, 1)) * 100,
  )

  return (
    <div
      ref={sessionStartRef}
      tabIndex={-1}
      className="flex w-full max-w-6xl mx-auto flex-col gap-6 sm:gap-8 pt-4 pb-10 sm:pt-6 sm:pb-14 px-2 sm:px-4 outline-none"
    >
      <ActiveSessionChrome />

      <WordSearchHeader
        title={puzzle.title}
        mode={puzzle.mode}
        foundCount={foundWordIds.size}
        totalCount={puzzle.items.length}
        progressPercent={progressPercent}
        elapsedSeconds={elapsedSeconds}
        formatTime={formatTime}
        onRestart={() => handleStartPuzzle(puzzle)}
        onExit={handleExitSession}
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
        <div className="grid w-full items-start gap-5 sm:gap-6 lg:grid-cols-2">
          <WordSearchGrid
            key={`grid-${runId}`}
            grid={puzzle.grid}
            placements={puzzle.placements}
            foundWordIds={foundWordIds}
            highlightedCells={highlightedCells}
            onSelectPath={handleSelectPath}
            lastFoundItem={lastFoundItem}
            onDismissLastFound={() => setLastFoundItem(null)}
          />

          <WordClueList
            key={`clues-${runId}`}
            items={itemsWithFoundState}
            mode={puzzle.mode}
            activeWordId={activeWordId}
            hintTargetId={hintTargetId}
            hintProgress={hintProgress}
            onInspectWord={setActiveWordId}
            onRevealLetter={handleRevealLetter}
          />
        </div>
      )}
    </div>
  )
}
