'use client'

// Planned structure:
// <ExerciseTestNav>
//   <StepControls />
//   <ModeToggle />
//   <DomainGroups>
//     <DomainHeader />
//     <ExerciseItemList />
//   </DomainGroups>
// </ExerciseTestNav>

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
            'flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-caption font-medium transition-colors focus-ring',
            viewMode === 'single'
              ? 'bg-surface-raised text-fg shadow-2xs font-semibold'
              : 'text-fg-muted hover:text-fg',
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
            'flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 text-caption font-medium transition-colors focus-ring',
            viewMode === 'split'
              ? 'bg-surface-raised text-fg shadow-2xs font-semibold'
              : 'text-fg-muted hover:text-fg',
            !canSplit && 'cursor-not-allowed opacity-50',
          )}
        >
          <Columns2 size={12} aria-hidden />
          Comparar
        </button>
      </div>

      {grouped.map(({ domain, items }) => (
        <div key={domain} className="flex flex-col gap-1 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="font-kicker text-fg-subtle">
              {DOMAIN_LABELS[domain]}
            </span>
            <span className="font-mono text-tiny text-fg-subtle">
              {items.length}
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {items.map((entry) => {
              const active = entry.id === activeEntryId
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(entry, viewMode)}
                    className={cn(
                      'group/item flex w-full flex-col justify-center rounded-md px-3 py-2 text-left transition-all duration-150 focus-ring',
                      active
                        ? 'bg-primary-soft text-primary ring-1 ring-primary/40 font-medium'
                        : 'text-fg-secondary hover:bg-surface-sunken hover:text-fg',
                    )}
                  >
                    <span className={cn('truncate text-body-sm font-medium', active && 'text-primary')}>
                      {entry.label}
                    </span>
                    <span className={cn('truncate font-mono text-tiny text-fg-subtle', active && 'text-primary/70')}>
                      {entry.slug}
                    </span>
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
