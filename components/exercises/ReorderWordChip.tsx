'use client'

import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { cn } from '@/lib/cn'
import type { BoardChip } from '@/lib/exercises/reorder-board'

interface Props {
  chip: BoardChip
  index: number
  variant: 'bank' | 'placed'
  locked: boolean
  isDragging: boolean
  dragOffset?: { dx: number; dy: number } | null
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void
}

/** One draggable word chip without intrusive nudge arrows. */
export function ReorderWordChip({
  chip,
  index,
  variant,
  locked,
  isDragging,
  dragOffset,
  onPointerDown,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      data-chip-index={index}
      data-chip-key={chip.key}
      onPointerDown={onPointerDown}
      onClick={onClick}
      disabled={locked}
      style={
        isDragging && dragOffset
          ? {
              transform: `translate3d(${dragOffset.dx}px, ${dragOffset.dy}px, 0)`,
              zIndex: 50,
            }
          : undefined
      }
      className={cn(
        'inline-flex h-17 items-center justify-center rounded-2xl border border-b-4 px-6 text-body-lg font-semibold select-none focus-ring cursor-grab active:cursor-grabbing touch-none transition-colors duration-150 active:scale-[0.96]',
        !locked && variant === 'bank' && 'border-border-strong bg-surface-raised text-fg hover:border-primary/60',
        !locked && variant === 'placed' && 'border-border-default border-b-border-strong bg-surface-raised text-fg hover:border-b-primary/60',
        locked && 'border-border-subtle bg-surface-raised opacity-70 cursor-default text-fg-muted',
        isDragging && 'pointer-events-none shadow-2xl scale-105 opacity-90 ring-2 ring-primary z-50',
      )}
    >
      {chip.word}
    </button>
  )
}
