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
        'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-body-md font-medium select-none focus-ring cursor-grab active:cursor-grabbing touch-none transition-colors duration-150 active:scale-[0.96]',
        !locked && variant === 'bank' && 'border border-border-default bg-surface-sunken/60 text-fg hover:border-primary/60 hover:bg-surface-sunken shadow-xs',
        !locked && variant === 'placed' && 'border border-primary bg-primary text-on-primary font-semibold shadow-xs hover:bg-primary-hover',
        locked && 'border border-border-subtle bg-surface-sunken opacity-70 cursor-default text-fg-muted',
        isDragging && 'pointer-events-none shadow-2xl scale-105 opacity-90 ring-2 ring-primary z-50',
      )}
    >
      {chip.word}
    </button>
  )
}
