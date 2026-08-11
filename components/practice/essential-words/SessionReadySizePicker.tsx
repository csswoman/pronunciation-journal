'use client'

// Planned structure:
// <SessionReadySizePicker> size pill × 3 </SessionReadySizePicker>

import { cn } from '@/lib/cn'
import { SESSION_SIZES, type SessionSizeId } from '@/lib/essential-words/session-size'

interface Props {
  value: SessionSizeId
  onChange: (id: SessionSizeId) => void
  disabled?: boolean
}

const chipClass = (selected: boolean) =>
  cn(
    'inline-flex min-h-10 w-full items-center justify-center rounded-full px-2 py-2',
    'text-caption font-semibold transition-[color,background-color,border-color,transform]',
    'duration-150 ease-out-quart focus-ring active:scale-[0.97]',
    'motion-reduce:transition-colors motion-reduce:active:scale-100',
    selected
      ? 'border border-info bg-info-soft text-fg'
      : 'border border-transparent bg-surface-sunken text-fg-muted hover:bg-surface-raised hover:text-fg',
  )

export function SessionReadySizePicker({ value, onChange, disabled = false }: Props) {
  return (
    <div
      role="group"
      aria-label="Cantidad de ejercicios"
      className="grid grid-cols-3 gap-2"
    >
      {SESSION_SIZES.map((size) => {
        const selected = size.id === value
        return (
          <button
            key={size.id}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(size.id)}
            className={cn(chipClass(selected), 'disabled:cursor-not-allowed disabled:opacity-60')}
          >
            {size.label}
          </button>
        )
      })}
    </div>
  )
}
