'use client'

import type { MissionCategory } from '@/lib/ai-practice/missions/types'
import { cn } from '@/lib/cn'
import { MISSION_CATEGORY_LABELS } from './mission-category-labels'

const CATEGORIES = Object.entries(MISSION_CATEGORY_LABELS) as Array<
  [MissionCategory | 'all', string]
>

interface MissionCategoryFilterProps {
  active: MissionCategory | 'all'
  onChange: (category: MissionCategory | 'all') => void
}

export function MissionCategoryFilter({ active, onChange }: MissionCategoryFilterProps) {
  return (
    <div
      role="toolbar"
      aria-label="Filtrar misiones por categoría"
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {CATEGORIES.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={active === id}
          onClick={() => onChange(id)}
          className={cn(
            'shrink-0 cursor-pointer rounded-full border px-3 text-label transition-colors focus-ring',
            'min-h-11 motion-reduce:transition-none',
            active === id
              ? 'border-primary bg-primary-soft text-primary'
              : 'border-border-subtle bg-surface-raised text-fg-muted hover:text-fg',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
