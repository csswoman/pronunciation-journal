'use client'

import { ChevronLeft, ChevronRight, Columns2, Play } from "@/components/icons"
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { DOMAIN_LABELS } from '@/components/practice/test/constants'
import type { TestGalleryDomain, TestGalleryEntry } from '@/lib/practice/test-gallery/fixtures'

type ViewMode = 'single' | 'split'

interface Props {
  grouped: { domain: TestGalleryDomain; items: TestGalleryEntry[] }[]
  activeEntryId: string | null
  viewMode: ViewMode
  canSplit: boolean
  canStep: boolean
  onViewModeChange: (mode: ViewMode) => void
  onPrev: () => void
  onNext: () => void
  onSelect: (entry: TestGalleryEntry, mode: ViewMode) => void
}

export function ExerciseTestNav({
  grouped,
  activeEntryId,
  viewMode,
  canSplit,
  canStep,
  onViewModeChange,
  onPrev,
  onNext,
  onSelect,
}: Props) {
  return (
    <nav className="flex flex-col gap-3" aria-label="Ejercicios">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<ChevronLeft size={14} />}
          disabled={!canStep}
          onClick={onPrev}
          aria-label="Ejercicio anterior"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<ChevronRight size={14} />}
          iconPosition="right"
          disabled={!canStep}
          onClick={onNext}
          className="flex-1"
          aria-label="Siguiente ejercicio"
        >
          Rotar
        </Button>
      </div>

      <div className="flex gap-1 rounded-md bg-surface-sunken p-1">
        <button
          type="button"
          onClick={() => onViewModeChange('single')}
          className={cn(
            'flex min-h-11 flex-1 items-center justify-center gap-1 rounded-sm px-2 py-2 text-caption font-medium transition-colors focus-ring',
            viewMode === 'single' ? 'bg-surface-raised text-fg shadow-sm' : 'text-fg-muted',
          )}
        >
          <Play size={12} aria-hidden />
          Individual
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('split')}
          disabled={!canSplit}
          className={cn(
            'flex min-h-11 flex-1 items-center justify-center gap-1 rounded-sm px-2 py-2 text-caption font-medium transition-colors focus-ring',
            viewMode === 'split' ? 'bg-surface-raised text-fg shadow-sm' : 'text-fg-muted',
            !canSplit && 'cursor-not-allowed opacity-50',
          )}
        >
          <Columns2 size={12} aria-hidden />
          Comparar
        </button>
      </div>

      {grouped.map(({ domain, items }) => (
        <div key={domain} className="flex flex-col gap-1">
          <p className="px-1 font-kicker text-fg-subtle">
            {DOMAIN_LABELS[domain]}
          </p>
          <ul className="flex flex-col gap-0.5">
            {items.map((entry) => {
              const active = entry.id === activeEntryId
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(entry, viewMode)}
                    className={cn(
                      'flex min-h-11 w-full flex-col justify-center rounded-md px-3 py-2.5 text-left transition-colors focus-ring',
                      active
                        ? 'bg-primary/10 text-fg ring-1 ring-primary/30'
                        : 'text-fg-secondary hover:bg-surface-sunken hover:text-fg',
                    )}
                  >
                    <span className="truncate text-body-sm font-medium">{entry.label}</span>
                    <span className="truncate font-mono text-xxs text-fg-muted">{entry.slug}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
