'use client'

import React, { useRef, useState, useCallback } from 'react'
import type { CellCoordinate, WordPlacement } from '@/lib/exercises/word-search/types'
import { getPathBetween } from '@/lib/exercises/word-search/grid-generator'

interface Props {
  grid: string[][]
  placements: WordPlacement[]
  foundWordIds: Set<string>
  activeWordId: string | null
  onSelectPath: (path: CellCoordinate[]) => void
}

export default function WordSearchGrid({
  grid,
  placements,
  foundWordIds,
  activeWordId,
  onSelectPath,
}: Props) {
  const size = grid.length
  const [dragStart, setDragStart] = useState<CellCoordinate | null>(null)
  const [currentDragPath, setCurrentDragPath] = useState<CellCoordinate[]>([])
  const gridRef = useRef<HTMLDivElement>(null)

  // Map to identify which cells belong to which found words
  const foundCellMap = React.useMemo(() => {
    const map = new Map<string, string>() // "row-col" -> wordId
    for (const p of placements) {
      if (foundWordIds.has(p.wordId)) {
        for (const coord of p.path) {
          map.set(`${coord.row}-${coord.col}`, p.wordId)
        }
      }
    }
    return map
  }, [placements, foundWordIds])

  // Set of coordinates in current drag selection
  const dragCoordSet = React.useMemo(() => {
    const set = new Set<string>()
    for (const c of currentDragPath) {
      set.add(`${c.row}-${c.col}`)
    }
    return set
  }, [currentDragPath])

  // Set of coordinates for the actively inspected/highlighted word
  const activeWordCoordSet = React.useMemo(() => {
    const set = new Set<string>()
    if (!activeWordId) return set
    const p = placements.find((item) => item.wordId === activeWordId)
    if (p) {
      for (const c of p.path) {
        set.add(`${c.row}-${c.col}`)
      }
    }
    return set
  }, [activeWordId, placements])

  const getCellFromEvent = useCallback(
    (clientX: number, clientY: number): CellCoordinate | null => {
      if (!gridRef.current) return null
      const elem = document.elementFromPoint(clientX, clientY)
      if (!elem) return null
      const cellElem = elem.closest('[data-cell-row]') as HTMLElement | null
      if (!cellElem) return null

      const row = parseInt(cellElem.dataset.cellRow ?? '-1', 10)
      const col = parseInt(cellElem.dataset.cellCol ?? '-1', 10)
      if (row >= 0 && col >= 0 && row < size && col < size) {
        return { row, col }
      }
      return null
    },
    [size]
  )

  const handlePointerDown = (row: number, col: number, e: React.PointerEvent) => {
    e.preventDefault()
    const startCoord = { row, col }
    setDragStart(startCoord)
    setCurrentDragPath([startCoord])
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return
    const cell = getCellFromEvent(e.clientX, e.clientY)
    if (cell) {
      const path = getPathBetween(dragStart, cell)
      if (path.length > 0) {
        setCurrentDragPath(path)
      }
    }
  }

  const handlePointerUp = () => {
    if (dragStart && currentDragPath.length > 0) {
      onSelectPath(currentDragPath)
    }
    setDragStart(null)
    setCurrentDragPath([])
  }

  return (
    <div
      className="flex flex-col items-center justify-center w-full select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        ref={gridRef}
        className="grid gap-1.5 p-3 sm:p-4 rounded-xl bg-surface-raised border border-border-subtle shadow-sm transition-all"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          touchAction: 'none',
          maxWidth: size <= 9 ? '420px' : '480px',
          width: '100%',
        }}
      >
        {grid.map((rowArr, rIdx) =>
          rowArr.map((letter, cIdx) => {
            const key = `${rIdx}-${cIdx}`
            const isFound = foundCellMap.has(key)
            const isSelected = dragCoordSet.has(key)
            const isActive = activeWordCoordSet.has(key)

            let cellStyle =
              'bg-surface-base text-fg hover:bg-surface-sunken border border-border-subtle'

            if (isSelected) {
              cellStyle =
                'bg-primary-soft text-primary font-bold ring-2 ring-primary/60 scale-95 transition-transform'
            } else if (isActive) {
              cellStyle =
                'bg-primary-soft text-primary font-bold ring-2 ring-primary/40 animate-pulse'
            } else if (isFound) {
              cellStyle =
                'bg-success-soft text-success font-bold border-success/30'
            }

            return (
              <button
                key={key}
                type="button"
                data-cell-row={rIdx}
                data-cell-col={cIdx}
                onPointerDown={(e) => handlePointerDown(rIdx, cIdx, e)}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-sm sm:text-base md:text-lg font-mono font-bold
                  transition-colors cursor-pointer select-none
                  ${cellStyle}
                `}
                aria-label={`Fila ${rIdx + 1}, Columna ${cIdx + 1}: ${letter}`}
              >
                {letter}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
