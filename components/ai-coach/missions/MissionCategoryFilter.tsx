'use client'

import { cn } from '@/lib/cn'
import { MISSION_CATEGORY_LABELS, type MissionFilterCategory } from './mission-category-labels'

// Planned structure:
// <MissionCategoryFilter>
//   <FilterToolbar>
//     <CategoryChip /> — active pill (purple) or inactive pill with category color dot
//   </FilterToolbar>
// </MissionCategoryFilter>

const CATEGORIES = Object.entries(MISSION_CATEGORY_LABELS) as Array<
  [MissionFilterCategory, string]
>

const CATEGORY_DOTS: Record<MissionFilterCategory, string | null> = {
  all: null,
  interview: 'bg-sky-400',
  service: 'bg-amber-400',
  workplace: 'bg-purple-400',
  social: 'bg-rose-400',
  generated: 'bg-emerald-400',
}

interface MissionCategoryFilterProps {
  active: MissionFilterCategory
  onChange: (category: MissionFilterCategory) => void
}

export function MissionCategoryFilter({ active, onChange }: MissionCategoryFilterProps) {
  return (
    <div
      role="toolbar"
      aria-label="Filtrar misiones por categoría"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {CATEGORIES.map(([id, label]) => {
        const dotClass = CATEGORY_DOTS[id]
        const isActive = active === id

        return (
          <button
            key={id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-ring',
              'min-h-9 motion-reduce:transition-none',
              isActive
                ? 'border-primary bg-primary text-white shadow-xs'
                : 'border-border-subtle bg-surface-raised text-fg-muted hover:text-fg hover:border-border',
            )}
          >
            {dotClass && !isActive && (
              <span className={cn('size-2 rounded-full shrink-0', dotClass)} aria-hidden="true" />
            )}
            {label}
          </button>
        )
      })}
    </div>
  )
}
