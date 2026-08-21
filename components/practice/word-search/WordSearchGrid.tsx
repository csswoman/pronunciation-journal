'use client'

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

function coordinateKey({ row, col }: CellCoordinate): string {
  return `${row}-${col}`
}

function sameCoordinate(a: CellCoordinate, b: CellCoordinate): boolean {
  return a.row === b.row && a.col === b.col
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

  const foundCellSet = useMemo(() => {
    const cells = new Set<string>()
    for (const placement of placements) {
      if (!foundWordIds.has(placement.wordId)) continue
      for (const coordinate of placement.path) {
        cells.add(coordinateKey(coordinate))
      }
    }
    return cells
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
      if (result === 'invalid' || result === 'already-found') {
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

  const getCellFromPoint = useCallback(
    (clientX: number, clientY: number): CellCoordinate | null => {
      const element = document.elementFromPoint(clientX, clientY)
      const cell = element?.closest<HTMLElement>('[data-cell-row]')
      if (!cell || !gridRef.current?.contains(cell)) return null

      const row = Number.parseInt(cell.dataset.cellRow ?? '-1', 10)
      const col = Number.parseInt(cell.dataset.cellCol ?? '-1', 10)
      if (row < 0 || col < 0 || row >= size || col >= size) return null
      return { row, col }
    },
    [size],
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
    const start = { row, col }
    setFocusedCell(start)
    setPointerStart(start)
    setPointerPath([start])
    clearPathFeedback()
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerStart) return
    const end = getCellFromPoint(event.clientX, event.clientY)
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

  const cancelPointerSelection = () => {
    setPointerStart(null)
    setPointerPath([])
  }

  const focusCoordinate = (coordinate: CellCoordinate) => {
    setFocusedCell(coordinate)
    gridRef.current
      ?.querySelector<HTMLElement>(
        `[data-cell-row="${coordinate.row}"][data-cell-col="${coordinate.col}"]`,
      )
      ?.focus()
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
      focusCoordinate({
        row: Math.min(size - 1, Math.max(0, coordinate.row + movement[0])),
        col: Math.min(size - 1, Math.max(0, coordinate.col + movement[1])),
      })
      return
    }

    if (event.key === 'Escape' && tapStart) {
      event.preventDefault()
      setTapStart(null)
      setInteractionMessage('Selección cancelada.')
    }
  }

  const cellTextClass = size <= 9 ? 'text-body-md md:text-h4' : 'text-caption md:text-label'
  const gridMaxWidth = size <= 9 ? '32rem' : '34rem'

  return (
    <section className="flex w-full flex-col gap-3" aria-labelledby="word-search-board-title">
      <div className="flex flex-col gap-1">
        <h2 id="word-search-board-title" className="text-h4 text-fg">
          Tablero
        </h2>
        <p id="word-search-board-help" className="max-w-prose text-pretty text-body-sm text-fg-muted">
          Arrastra sobre una palabra o selecciona su primera y última letra. Usa las flechas para moverte con el teclado.
        </p>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label="Sopa de letras"
        aria-describedby="word-search-board-help"
        aria-rowcount={size}
        aria-colcount={size}
        className="grid w-full select-none gap-1 self-center rounded-lg bg-surface-sunken p-2"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          touchAction: 'none',
          maxWidth: gridMaxWidth,
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerSelection}
        onPointerCancel={cancelPointerSelection}
      >
        {grid.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} role="row" className="contents">
            {row.map((letter, colIndex) => {
              const coordinate = { row: rowIndex, col: colIndex }
              const key = coordinateKey(coordinate)
              const isFound = foundCellSet.has(key)
              const isSelected = selectedCellSet.has(key)
              const isActive = activeWordCellSet.has(key)
              const isFeedback = feedbackCellSet.has(key)
              const feedbackResult = pathFeedback?.result

              let state = 'idle'
              let cellStyle = 'bg-surface-raised text-fg hover:bg-surface-base'
              if (isFeedback && feedbackResult === 'invalid') {
                state = 'invalid'
                cellStyle = 'bg-error-soft text-error ring-2 ring-error/50'
              } else if (isFeedback && feedbackResult === 'already-found') {
                state = 'already-found'
                cellStyle = 'bg-warning-soft text-warning ring-2 ring-warning/50'
              } else if (isSelected) {
                state = 'selected'
                cellStyle = 'bg-primary-soft text-primary ring-2 ring-primary/60'
              } else if (isActive) {
                state = 'active'
                cellStyle = 'bg-primary-soft text-primary ring-2 ring-primary/40'
              } else if (isFound) {
                state = 'found'
                cellStyle = 'bg-success-soft text-success'
              }

              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  data-cell-row={rowIndex}
                  data-cell-col={colIndex}
                  data-state={state}
                  tabIndex={sameCoordinate(focusedCell, coordinate) ? 0 : -1}
                  aria-label={`Fila ${rowIndex + 1}, columna ${colIndex + 1}, letra ${letter}`}
                  aria-selected={isSelected || undefined}
                  onFocus={() => setFocusedCell(coordinate)}
                  onPointerDown={(event) => handlePointerDown(rowIndex, colIndex, event)}
                  onClick={() => {
                    if (pointerHandledClickRef.current) {
                      pointerHandledClickRef.current = false
                      return
                    }
                    handleTapCoordinate(coordinate)
                  }}
                  onKeyDown={(event) => handleCellKeyDown(coordinate, event)}
                  className={`focus-ring flex aspect-square min-w-0 select-none items-center justify-center rounded-sm font-mono font-bold transition-[background-color,color,box-shadow,transform] duration-150 ease-out-quart active:scale-[0.96] motion-reduce:transform-none ${cellTextClass} ${cellStyle}`}
                >
                  {letter}
                </button>
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
