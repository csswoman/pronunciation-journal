'use client'

import { cn } from '@/lib/cn'
import { SESSION_SIZES, type SessionSizeId } from '@/lib/essential-words/session-size'

interface Props {
  value: SessionSizeId
  onChange: (id: SessionSizeId) => void
  disabled?: boolean
}

const SIZE_DETAILS: Record<SessionSizeId, { number: string; title: string; duration: string }> = {
  short: { number: '5', title: 'Corta', duration: '1 min' },
  recommended: { number: '15', title: 'Media', duration: '4 min' },
  long: { number: '25', title: 'Larga', duration: '7 min' },
}

export function SessionReadySizePicker({ value, onChange, disabled = false }: Props) {
  return (
    <div
      role="group"
      aria-label="Cantidad de ejercicios"
      className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full"
    >
      {SESSION_SIZES.map((size) => {
        const selected = size.id === value
        const details = SIZE_DETAILS[size.id]
        return (
          <button
            key={size.id}
            type="button"
            aria-pressed={selected}
            aria-label={size.label}
            disabled={disabled}
            onClick={() => onChange(size.id)}
            className={cn(
              'flex flex-col items-start justify-between rounded-2xl p-3 sm:p-3.5 text-left transition-all duration-150 ease-out cursor-pointer',
              'focus-visible:outline-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-60',
              selected
                ? 'bg-ink text-paper shadow-md scale-[1.02]'
                : 'bg-paper/40 hover:bg-paper/60 text-ink border border-ink/10',
            )}
          >
            <span className={cn('text-2xl sm:text-3xl font-black leading-none', selected ? 'text-paper' : 'text-ink')}>
              {details.number}
            </span>
            <span className={cn('text-xs sm:text-sm font-semibold mt-1.5', selected ? 'text-paper/80' : 'text-ink-secondary')}>
              {details.title} · {details.duration}
            </span>
          </button>
        )
      })}
    </div>
  )
}
