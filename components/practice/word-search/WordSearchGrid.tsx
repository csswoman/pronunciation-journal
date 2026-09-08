'use client'

// Planned structure:
// <WordSearchGrid>
//   <GridHeader />         (título accesible e instrucciones táctiles/teclado)
//   <BoardSurface>         (role="grid" con contenedor táctil y styling Apple HIG)
//     <WordSearchCell />   (celdas individuales con respuesta háptica y animaciones)
//   </BoardSurface>
//   <ScreenReaderStatus /> (mensajes de accesibilidad para lectores de pantalla)
// </WordSearchGrid>

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import type {
  CellCoordinate,
  WordPlacement,
  WordSelectionResult,
} from '@/lib/exercises/word-search/types'
import { getPathBetween } from '@/lib/exercises/word-search/grid-generator'
import { getWordColorTheme } from '@/lib/exercises/word-search/word-colors'
import WordSearchCell, { type CellVisualState } from './WordSearchCell'
import {
  coordinateKey,
  sameCoordinate,
  triggerHaptic,
  getCellFromPoint,
} from './grid-helpers'

interface Props {
  grid: string[][]
  placements: WordPlacement[]
  foundWordIds: Set<string>
  activeWordId: string | null
  onSelectPath: (path: CellCoordinate[]) => WordSelectionResult
}

interface PathFeedback {
  path: CellCoordinate[]
  result: Exclude<WordSelectionResult, 'found'>
}

export default function WordSearchGrid({
  grid,
  placements,
  foundWordIds,
  activeWordId,
  onSelectPath,
}: Props) {
  const size = grid.length
  const [pointerStart, setPointerStart] = useState<CellCoordinate | null>(null)
  const [pointerPath, setPointerPath] = useState<CellCoordinate[]>([])
  const [tapStart, setTapStart] = useState<CellCoordinate | null>(null)
  const [focusedCell, setFocusedCell] = useState<CellCoordinate>({ row: 0, col: 0 })
  const [pathFeedback, setPathFeedback] = useState<PathFeedback | null>(null)
  const [interactionMessage, setInteractionMessage] = useState('')
  const gridRef = useRef<HTMLDivElement>(null)
  const feedbackTimerRef = useRef<number | null>(null)
  const pointerHandledClickRef = useRef(false)

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  const foundCellMap = useMemo(() => {
    const map = new Map<string, number>()
    placements.forEach((placement, placementIndex) => {
      if (!foundWordIds.has(placement.wordId)) return
      for (const coordinate of placement.path) {
        map.set(coordinateKey(coordinate), placementIndex)
      }
    })
    return map
  }, [placements, foundWordIds])

  const activeWordCellSet = useMemo(() => {
    const cells = new Set<string>()
    if (!activeWordId) return cells
    const placement = placements.find((item) => item.wordId === activeWordId)
    for (const coordinate of placement?.path ?? []) {
      cells.add(coordinateKey(coordinate))
    }
    return cells
  }, [activeWordId, placements])

  const selectedCellSet = useMemo(() => {
    const cells = new Set(pointerPath.map(coordinateKey))
    if (tapStart) cells.add(coordinateKey(tapStart))
    return cells
  }, [pointerPath, tapStart])

  const feedbackCellSet = useMemo(
    () => new Set(pathFeedback?.path.map(coordinateKey) ?? []),
    [pathFeedback],
  )

  const clearPathFeedback = useCallback(() => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current)
    }
    feedbackTimerRef.current = null
    setPathFeedback(null)
  }, [])

  const showPathFeedback = useCallback(
    (path: CellCoordinate[], result: PathFeedback['result']) => {
      clearPathFeedback()
      setPathFeedback({ path, result })
      feedbackTimerRef.current = window.setTimeout(() => {
        setPathFeedback(null)
        feedbackTimerRef.current = null
      }, 650)
    },
    [clearPathFeedback],
  )

  const submitPath = useCallback(
    (path: CellCoordinate[]) => {
      const result = onSelectPath(path)
      if (result === 'found') {
        triggerHaptic([12, 35, 20])
        clearPathFeedback()
      } else if (result === 'invalid' || result === 'already-found') {
        triggerHaptic(result === 'invalid' ? 25 : [15, 30])
        showPathFeedback(path, result)
      } else {
        clearPathFeedback()
      }
      return result
    },
    [clearPathFeedback, onSelectPath, showPathFeedback],
  )

  const handleTapCoordinate = useCallback(
    (coordinate: CellCoordinate) => {
      clearPathFeedback()
      if (!tapStart) {
        triggerHaptic(8)
        setTapStart(coordinate)
        const letter = grid[coordinate.row]?.[coordinate.col] ?? ''
        setInteractionMessage(
          `Inicio seleccionado en la letra ${letter}. Elige la última letra.`,
        )
        return
      }

      if (sameCoordinate(tapStart, coordinate)) {
        setTapStart(null)
        setInteractionMessage('Selección cancelada.')
        return
      }

      const path = getPathBetween(tapStart, coordinate)
      if (path.length < 2) {
        onSelectPath(path)
        showPathFeedback([tapStart, coordinate], 'invalid')
      } else {
        submitPath(path)
      }
      setTapStart(null)
      setInteractionMessage('')
    },
    [clearPathFeedback, grid, onSelectPath, showPathFeedback, submitPath, tapStart],
  )

  const handlePointerDown = (
    row: number,
    col: number,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    pointerHandledClickRef.current = true
    triggerHaptic(8)
    const start = { row, col }
    setFocusedCell(start)
    setPointerStart(start)
    setPointerPath([start])
    clearPathFeedback()
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerStart) return
    const end = getCellFromPoint(event.clientX, event.clientY, size, gridRef.current)
    if (!end) return
    const path = getPathBetween(pointerStart, end)
    if (path.length > 0) setPointerPath(path)
  }

  const finishPointerSelection = () => {
    if (!pointerStart) return
    if (pointerPath.length > 1) {
      submitPath(pointerPath)
      setTapStart(null)
      setInteractionMessage('')
    } else {
      handleTapCoordinate(pointerStart)
    }
    setPointerStart(null)
    setPointerPath([])
  }

  const handleCellKeyDown = (
    coordinate: CellCoordinate,
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    const movement = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    }[event.key]

    if (movement) {
      event.preventDefault()
      const next = {
        row: Math.min(size - 1, Math.max(0, coordinate.row + movement[0])),
        col: Math.min(size - 1, Math.max(0, coordinate.col + movement[1])),
      }
      setFocusedCell(next)
      gridRef.current
        ?.querySelector<HTMLElement>(
          `[data-cell-row="${next.row}"][data-cell-col="${next.col}"]`,
        )
        ?.focus()
      return
    }

    if (event.key === 'Escape' && tapStart) {
      event.preventDefault()
      setTapStart(null)
      setInteractionMessage('Selección cancelada.')
    }
  }

  const gridMaxWidth = size <= 9 ? '32rem' : '34rem'

  return (
    <section className="flex w-full flex-col gap-3" aria-labelledby="word-search-board-title">
      <div className="flex flex-col gap-1">
        <h2 id="word-search-board-title" className="text-h4 font-bold text-fg">
          Tablero
        </h2>
        <p id="word-search-board-help" className="max-w-prose text-pretty text-body-sm text-fg-muted">
          Arrastra sobre una palabra o toca su primera y última letra. Usa las flechas para navegar con el teclado.
        </p>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label="Sopa de letras"
        aria-describedby="word-search-board-help"
        aria-rowcount={size}
        aria-colcount={size}
        className="grid w-full select-none gap-1 self-center rounded-2xl border border-border-subtle bg-surface-sunken p-2 shadow-xs sm:gap-1.5 sm:p-3"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          touchAction: 'none',
          maxWidth: gridMaxWidth,
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerSelection}
        onPointerCancel={() => {
          setPointerStart(null)
          setPointerPath([])
        }}
      >
        {grid.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} role="row" className="contents">
            {row.map((letter, colIndex) => {
              const coordinate = { row: rowIndex, col: colIndex }
              const key = coordinateKey(coordinate)
              const foundPlacementIndex = foundCellMap.get(key)
              const isFound = foundPlacementIndex !== undefined
              const isTapAnchor = tapStart !== null && sameCoordinate(tapStart, coordinate)
              const isSelected = selectedCellSet.has(key)
              const isActive = activeWordCellSet.has(key)
              const isFeedback = feedbackCellSet.has(key)
              const feedbackResult = pathFeedback?.result

              let state: CellVisualState = 'idle'
              if (isFeedback && feedbackResult === 'invalid') state = 'invalid'
              else if (isFeedback && feedbackResult === 'already-found') state = 'already-found'
              else if (isTapAnchor) state = 'tap-anchor'
              else if (isSelected) state = 'selected'
              else if (isActive) state = 'active'
              else if (isFound) state = 'found'

              const colorTheme =
                foundPlacementIndex !== undefined
                  ? getWordColorTheme(foundPlacementIndex)
                  : undefined

              return (
                <WordSearchCell
                  key={key}
                  coordinate={coordinate}
                  letter={letter}
                  size={size}
                  state={state}
                  colorTheme={colorTheme}
                  isFocused={sameCoordinate(focusedCell, coordinate)}
                  onFocus={() => setFocusedCell(coordinate)}
                  onPointerDown={(e) => handlePointerDown(rowIndex, colIndex, e)}
                  onClick={() => {
                    if (pointerHandledClickRef.current) {
                      pointerHandledClickRef.current = false
                      return
                    }
                    handleTapCoordinate(coordinate)
                  }}
                  onKeyDown={(e) => handleCellKeyDown(coordinate, e)}
                />
              )
            })}
          </div>
        ))}
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {interactionMessage}
      </p>
    </section>
  )
}
