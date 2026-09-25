'use client'

// Planned structure:
// <ReviewHeaderFilters>
//   <SortByOverdueToggle />
//   <OnlyOverdueToggle />
// </ReviewHeaderFilters>

import { cn } from '@/lib/cn'
import { useReviewFiltersStore } from '@/lib/stores/reviewFiltersStore'

export function ReviewHeaderFilters() {
  const { sortByOverdue, onlyOverdue, toggleSortByOverdue, toggleOnlyOverdue } = useReviewFiltersStore()

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-pressed={sortByOverdue}
        onClick={toggleSortByOverdue}
        className={cn(
          'rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors',
          sortByOverdue
            ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
            : 'border-border-subtle bg-surface text-text-strong hover:bg-field',
        )}
      >
        Ordenar por retraso
      </button>
      <button
        type="button"
        aria-pressed={onlyOverdue}
        onClick={toggleOnlyOverdue}
        className={cn(
          'rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors',
          onlyOverdue
            ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
            : 'border-border-subtle bg-surface text-text-strong hover:bg-field',
        )}
      >
        Solo lo atrasado
      </button>
    </div>
  )
}
