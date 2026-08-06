'use client'

// Planned structure:
// <RoutePickerOption>
//   icon + labels + optional meta + checkmark
// </RoutePickerOption>

import { Check, Sparkles } from '@/components/icons'
import { cn } from '@/lib/cn'

interface Props {
  selected: boolean
  title: string
  description?: string
  meta?: string
  recommended?: boolean
  ariaLabel?: string
  onSelect: () => void
}

export function RoutePickerOption({
  selected,
  title,
  description,
  meta,
  recommended,
  ariaLabel,
  onSelect,
}: Props) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors focus-ring',
        selected
          ? 'border-primary bg-primary-soft text-primary'
          : 'border-border-subtle bg-surface-base text-fg hover:bg-surface-sunken',
      )}
    >
      {recommended ? (
        <span
          className={cn(
            'inline-flex size-8 shrink-0 items-center justify-center rounded-full',
            selected ? 'bg-primary/15 text-primary' : 'bg-surface-raised text-fg-muted',
          )}
          aria-hidden
        >
          <Sparkles size={16} />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className={cn('block font-label', selected ? 'text-primary' : 'text-fg')}>
          {title}
        </span>
        {description ? (
          <span
            className={cn(
              'mt-0.5 block text-caption',
              selected ? 'text-primary/80' : 'text-fg-muted',
            )}
          >
            {description}
          </span>
        ) : null}
      </span>
      {meta ? (
        <span
          className={cn(
            'shrink-0 text-caption tabular-nums',
            selected ? 'text-primary/80' : 'text-fg-subtle',
          )}
        >
          {meta}
        </span>
      ) : null}
      {selected ? <Check size={16} className="shrink-0 text-primary" aria-hidden /> : null}
    </button>
  )
}
