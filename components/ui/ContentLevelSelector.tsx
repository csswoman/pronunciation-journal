import { cn } from '@/lib/cn'

type ContentLevelSelectorProps<Level extends string> = {
  levels: readonly Level[]
  value: Level
  onChange: (next: Level) => void
  ariaLabel: string
  getLabel?: (level: Level) => string
  disabled?: boolean
  className?: string
}

/**
 * Shared CEFR-like level choice UI. Parents own the meaning and persistence of
 * the selected level; this component only renders and reports the selection.
 */
export default function ContentLevelSelector<Level extends string>({
  levels,
  value,
  onChange,
  ariaLabel,
  getLabel = String,
  disabled = false,
  className,
}: ContentLevelSelectorProps<Level>) {
  return (
    <div className={cn('grid grid-cols-5 gap-1', className)} role="group" aria-label={ariaLabel}>
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
              'focus-ring min-h-9 rounded-sm font-label transition-colors disabled:opacity-60',
              selected
                ? 'bg-primary text-on-primary'
                : 'bg-surface-sunken text-fg-muted hover:text-fg',
            )}
          >
            {getLabel(level)}
          </button>
        )
      })}
    </div>
  )
}
