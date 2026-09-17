'use client'

// Planned structure:
// <PracticeHubHeader> — Kicker "PRACTICAR" + Title "Práctica libre" + Subtitle + Category filter chips (Todo, Vocabulario, Sonido, Habla)

import { cn } from '@/lib/cn'

export type PracticeFilter = 'all' | 'vocab' | 'sound' | 'speech'

interface Props {
  fromDaily: boolean
  activeFilter?: PracticeFilter
  onFilterChange?: (filter: PracticeFilter) => void
}

const FILTERS: { id: PracticeFilter; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'vocab', label: 'Vocabulario' },
  { id: 'sound', label: 'Sonido' },
  { id: 'speech', label: 'Habla' },
]

export default function PracticeHubHeader({
  fromDaily,
  activeFilter = 'all',
  onFilterChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-2">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted select-none">
          PRACTICAR
        </span>
        <h1 className="font-heading text-h1 font-extrabold text-fg sm:text-4xl">
          {fromDaily ? 'Buen trabajo. Sigue así' : 'Práctica libre'}
        </h1>
        <p className="font-sans text-body-sm text-fg-muted">
          {fromDaily
            ? 'Terminaste el plan de hoy. Elige qué reforzar ahora.'
            : 'Elige por dónde entrar. Sin orden, sin ruta.'}
        </p>
      </div>

      <div
        className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto"
        role="tablist"
        aria-label="Filtro de categorías de práctica"
      >
        {FILTERS.map((f) => {
          const isSelected = activeFilter === f.id
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onFilterChange?.(f.id)}
              className={cn(
                'focus-ring inline-flex min-h-9 items-center rounded-full px-4 py-1.5 font-sans text-caption font-semibold transition-all select-none',
                isSelected
                  ? 'bg-ink text-paper shadow-xs'
                  : 'border border-border-default bg-surface-sunken text-fg-muted hover:bg-surface-raised hover:text-fg',
              )}
            >
              {f.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
