'use client'

import { cn } from '@/lib/cn'

export function JournalRailTab({
  active,
  onClick,
  controls,
  children,
}: {
  active: boolean
  onClick: () => void
  controls: string
  children: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={cn(
        'focus-ring min-h-11 flex-1 rounded-[var(--radius-sm)] px-2 text-center font-body-sm font-medium transition-colors duration-150',
        active ? 'bg-surface-raised text-fg' : 'text-fg-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}
