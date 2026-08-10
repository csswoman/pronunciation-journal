'use client'

// Planned structure:
// <SessionReadySizePicker> size chip × 3 </SessionReadySizePicker>

import { cn } from '@/lib/cn'
import { SESSION_SIZES, type SessionSizeId } from '@/lib/essential-words/session-size'

interface Props {
  value: SessionSizeId
  onChange: (id: SessionSizeId) => void
}

export function SessionReadySizePicker({ value, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Tamaño de sesión"
      className="grid grid-cols-3 gap-2"
    >
      {SESSION_SIZES.map((size) => {
        const selected = size.id === value
        return (
          <button
            key={size.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(size.id)}
            className={cn(
              'rounded-md px-2 py-2 text-center text-caption font-semibold transition-colors focus-ring',
              selected
                ? 'bg-primary-soft text-primary'
                : 'bg-surface-sunken text-fg-muted hover:text-fg',
            )}
          >
            {size.label}
          </button>
        )
      })}
    </div>
  )
}
