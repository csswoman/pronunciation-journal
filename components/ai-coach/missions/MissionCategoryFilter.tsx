'use client'

import type { MissionCategory } from '@/lib/ai-practice/missions/types'
import { cn } from '@/lib/cn'

const CATEGORIES: ReadonlyArray<{ id: MissionCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'interview', label: 'Entrevistas' },
  { id: 'service', label: 'Servicios' },
  { id: 'workplace', label: 'Trabajo' },
  { id: 'social', label: 'Social' },
]

interface MissionCategoryFilterProps {
  active: MissionCategory | 'all'
  onChange: (category: MissionCategory | 'all') => void
}

export function MissionCategoryFilter({ active, onChange }: MissionCategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Filtrar misiones por categoría">
      {CATEGORIES.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={active === id}
          onClick={() => onChange(id)}
          className={cn(
            'min-h-11 rounded-full border px-3 text-label cursor-pointer transition-colors focus-ring',
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
