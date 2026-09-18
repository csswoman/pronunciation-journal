import { cn } from '@/lib/cn'

type ContentLevelSelectorProps<Level extends string> = {
  levels: readonly Level[]
  value: Level
  onChange: (next: Level) => void
  ariaLabel: string
  getLabel?: (level: Level) => string
  disabled?: boolean
  className?: string
  /** English Journal design system: pill container on surface, active = accent fill. */
  variant?: 'default' | 'ej-pill'
}

/**
 * Shared CEFR-like level choice UI. Parents own the meaning and persistence of
 * the selected level; this component only renders and reports the selection.
 */
/**
 * Column count tracks the number of levels passed in, so a range that is not
 * five wide (a feature capped at B2, or a future C2) lays out correctly instead
 * of overflowing a hardcoded five-column grid. Tailwind needs literal class
 * names, so these are spelled out rather than interpolated.
 */
const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
}

export default function ContentLevelSelector<Level extends string>({
  levels,
  value,
  onChange,
  ariaLabel,
  getLabel = String,
  disabled = false,
  className,
  variant = 'default',
}: ContentLevelSelectorProps<Level>) {
  const columns = GRID_COLS[levels.length] ?? 'grid-cols-5'
  const isPill = variant === 'ej-pill'

  return (
    <div
      className={cn('grid gap-1', columns, isPill && 'rounded-full bg-ej-surface p-1', className)}
      role="group"
      aria-label={ariaLabel}
    >
      {levels.map((level) => {
        const selected = value === level

        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level)}
            aria-pressed={selected}
            aria-label={getLabel(level)}
            disabled={disabled}
            className={cn(
              'focus-ring min-h-9 font-label transition-colors disabled:opacity-60',
              isPill
                ? cn(
                    'rounded-full',
                    selected ? 'bg-accent text-on-accent' : 'text-ej-text-muted hover:text-ej-text',
                  )
                : cn(
                    'rounded-sm',
                    selected
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-sunken text-fg-muted hover:text-fg',
                  ),
            )}
          >
            {getLabel(level)}
          </button>
        )
      })}
    </div>
  )
}
